"""
DynamoDB Repository for SmartRentalTracking.

Implements all application query patterns directly against the single-table
DynamoDB schema and GSIs configured in Terraform:
  - Base Table: EquipmentID (PK) + CheckOutDate (SK)
  - GSI 1: SiteID-CheckInDate-index (Site-wise querying)
  - GSI 2: Type-CheckOutDate-index (Type-wise querying for Forecasting)
"""
import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from boto3.dynamodb.conditions import Key, Attr

from config import settings
from db.dynamo import get_dynamo_resource, to_dynamo_decimal, from_dynamo_decimal
from models.equipment import EquipmentStatus

logger = logging.getLogger("dynamo_repo")


class DynamoRepository:
    def __init__(self, table_name: str | None = None):
        self.table_name = table_name or settings.dynamodb_table_name
        self.resource = get_dynamo_resource()
        self.table = self.resource.Table(self.table_name)

    # -------------------------------------------------------------------------
    # EQUIPMENT OPERATIONS
    # -------------------------------------------------------------------------

    def get_equipment(self, equipment_id: str) -> dict[str, Any] | None:
        """Fetch the most recent state record for an equipment item."""
        resp = self.table.query(
            KeyConditionExpression=Key("EquipmentID").eq(equipment_id),
            ScanIndexForward=False,  # latest check-out / state first
            Limit=1,
        )
        items = resp.get("Items", [])
        if not items:
            return None
        return self._format_equipment(items[0])

    def list_all_equipment(self, site_id: str | None = None, type_: str | None = None) -> list[dict[str, Any]]:
        """
        List equipment using GSIs when possible:
          - GSI 1 (SiteID-CheckInDate-index) if site_id is filtered
          - GSI 2 (Type-CheckOutDate-index) if type_ is filtered
          - Or base table scan grouped by unique EquipmentID
        """
        if type_:
            # GSI 2: Query by Type
            resp = self.table.query(
                IndexName="Type-CheckOutDate-index",
                KeyConditionExpression=Key("Type").eq(type_),
            )
            raw_items = resp.get("Items", [])
        elif site_id:
            # GSI 1: Query by SiteID
            resp = self.table.query(
                IndexName="SiteID-CheckInDate-index",
                KeyConditionExpression=Key("SiteID").eq(site_id),
            )
            raw_items = resp.get("Items", [])
        else:
            resp = self.table.scan()
            raw_items = resp.get("Items", [])

        # Group by EquipmentID, keeping the latest CheckOutDate per machine
        latest_by_id: dict[str, dict[str, Any]] = {}
        for item in sorted(raw_items, key=lambda x: str(x.get("CheckOutDate", ""))):
            eq_id = item.get("EquipmentID")
            if eq_id:
                latest_by_id[eq_id] = item

        return [self._format_equipment(item) for item in latest_by_id.values()]

    def create_or_update_equipment(
        self,
        equipment_id: str,
        type_: str,
        site_id: str | None = None,
        name: str | None = None,
        model: str | None = None,
        serial_number: str | None = None,
        client_name: str | None = None,
        status: str = "Available",
    ) -> dict[str, Any]:
        """Creates or updates an equipment registration record."""
        existing = self.get_equipment(equipment_id)
        checkout_date = existing.get("check_out_date") if existing else str(date.today())

        item = {
            "EquipmentID": equipment_id,
            "CheckOutDate": checkout_date or str(date.today()),
            "Type": type_,
            "SiteID": site_id or "Depot",
            "Name": name or f"{type_} {equipment_id}",
            "Model": model or "Standard",
            "SerialNumber": serial_number or f"SN-{equipment_id}",
            "ClientName": client_name,
            "Status": status,
            "EngineHoursPerDay": Decimal("0.0"),
            "IdleHoursPerDay": Decimal("0.0"),
            "OperatingDays": 0,
        }
        self.table.put_item(Item=to_dynamo_decimal(item))
        return self._format_equipment(item)

    def update_status(self, equipment_id: str, status: str) -> dict[str, Any] | None:
        eq = self.get_equipment(equipment_id)
        if not eq:
            return None
        self.table.update_item(
            Key={"EquipmentID": equipment_id, "CheckOutDate": eq["check_out_date"]},
            UpdateExpression="SET #s = :status",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={":status": status},
        )
        eq["status"] = status
        return eq

    # -------------------------------------------------------------------------
    # CHECK-OUT & CHECK-IN OPERATIONS
    # -------------------------------------------------------------------------

    def create_checkout(
        self,
        equipment_id: str,
        check_out_date: date,
        site_id: str | None,
        operator_id: str | None,
        expected_return_date: date | None,
        qr_token: str | None,
        client_name: str | None = None,
        type_: str | None = None,
    ) -> dict[str, Any]:
        """Records a new check-out event item in DynamoDB."""
        current = self.get_equipment(equipment_id)
        eq_type = type_ or (current["type"] if current else "Excavator")

        item = {
            "EquipmentID": equipment_id,
            "CheckOutDate": str(check_out_date),
            "Type": eq_type,
            "SiteID": site_id or "Depot",
            "LastOperatorID": operator_id,
            "ExpectedReturnDate": str(expected_return_date) if expected_return_date else None,
            "QRToken": qr_token,
            "ClientName": client_name,
            "Status": "Rented",
            "EngineHoursPerDay": Decimal("0.0"),
            "IdleHoursPerDay": Decimal("0.0"),
            "OperatingDays": 0,
            "Name": current.get("name") if current else f"{eq_type} {equipment_id}",
            "Model": current.get("model") if current else "Standard",
        }
        self.table.put_item(Item=to_dynamo_decimal(item))
        return from_dynamo_decimal(item)

    def get_active_checkout(self, equipment_id: str) -> dict[str, Any] | None:
        """Finds the open rental event where CheckInDate has not been set."""
        resp = self.table.query(
            KeyConditionExpression=Key("EquipmentID").eq(equipment_id),
            FilterExpression=Attr("CheckInDate").not_exists() | Attr("CheckInDate").eq(None),
            ScanIndexForward=False,
            Limit=1,
        )
        items = resp.get("Items", [])
        return from_dynamo_decimal(items[0]) if items else None

    def get_by_qr_token(self, qr_token: str) -> dict[str, Any] | None:
        """Looks up a rental event by encrypted QR token."""
        resp = self.table.scan(
            FilterExpression=Attr("QRToken").eq(qr_token),
        )
        items = resp.get("Items", [])
        return from_dynamo_decimal(items[0]) if items else None

    def close_checkout(self, equipment_id: str, check_out_date: str, check_in_date: date) -> dict[str, Any]:
        """Closes a check-out by stamping CheckInDate and transitioning status to Available."""
        self.table.update_item(
            Key={"EquipmentID": equipment_id, "CheckOutDate": check_out_date},
            UpdateExpression="SET CheckInDate = :cid, #s = :status, ClientName = :empty",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={
                ":cid": str(check_in_date),
                ":status": "Available",
                ":empty": None,
            },
        )
        return {
            "equipment_id": equipment_id,
            "check_out_date": check_out_date,
            "check_in_date": str(check_in_date),
            "status": "Available",
        }

    def timeline(self, equipment_id: str) -> list[dict[str, Any]]:
        """Returns the full rental and dispatch history for an asset."""
        resp = self.table.query(
            KeyConditionExpression=Key("EquipmentID").eq(equipment_id),
            ScanIndexForward=False,
        )
        return [from_dynamo_decimal(item) for item in resp.get("Items", [])]

    # -------------------------------------------------------------------------
    # USAGE & TELEMETRY OPERATIONS
    # -------------------------------------------------------------------------

    def upsert_usage(
        self,
        equipment_id: str,
        log_date: date,
        engine_hours_day: float,
        idle_hours_day: float,
        operating_days_cumulative: int,
        last_operator_id: str | None,
    ) -> dict[str, Any]:
        """
        Records daily machine telemetry. Either updates the current rental item
        or logs an item for that date.
        """
        str_date = str(log_date)
        eq = self.get_equipment(equipment_id)
        eq_type = eq["type"] if eq else "Excavator"

        item = {
            "EquipmentID": equipment_id,
            "CheckOutDate": str_date,
            "Type": eq_type,
            "EngineHoursPerDay": Decimal(str(engine_hours_day)),
            "IdleHoursPerDay": Decimal(str(idle_hours_day)),
            "OperatingDays": operating_days_cumulative,
            "LastOperatorID": last_operator_id,
            "SiteID": eq.get("site_id") if eq else "Depot",
            "Status": eq.get("status") if eq else "Available",
        }
        self.table.put_item(Item=to_dynamo_decimal(item))
        return from_dynamo_decimal(item)

    def history_for_equipment(self, equipment_id: str, days: int = 90) -> list[dict[str, Any]]:
        since = str(date.today() - timedelta(days=days))
        resp = self.table.query(
            KeyConditionExpression=Key("EquipmentID").eq(equipment_id) & Key("CheckOutDate").gte(since),
            ScanIndexForward=True,
        )
        return [self._format_usage_log(item) for item in resp.get("Items", [])]

    def history_for_type(self, equipment_type: str, days: int = 180) -> list[dict[str, Any]]:
        """
        Uses GSI 2 (Type-CheckOutDate-index) directly to query historical
        telemetry for an entire equipment category without scanning the table.
        """
        since = str(date.today() - timedelta(days=days))
        resp = self.table.query(
            IndexName="Type-CheckOutDate-index",
            KeyConditionExpression=Key("Type").eq(equipment_type) & Key("CheckOutDate").gte(since),
            ScanIndexForward=True,
        )
        return [self._format_usage_log(item) for item in resp.get("Items", [])]

    def all_recent_usage(self, days: int = 30) -> list[dict[str, Any]]:
        since = str(date.today() - timedelta(days=days))
        resp = self.table.scan(
            FilterExpression=Attr("CheckOutDate").gte(since),
        )
        return [self._format_usage_log(item) for item in resp.get("Items", [])]

    # -------------------------------------------------------------------------
    # ALERTS & INCIDENT AUDIT
    # -------------------------------------------------------------------------

    def list_active_alerts(self) -> list[dict[str, Any]]:
        """
        Identifies active alerts across the fleet:
          1. Overdue: ExpectedReturnDate < today AND CheckInDate is None
          2. Expiring Soon: ExpectedReturnDate within 3 days AND CheckInDate is None
          3. Anomalies: IdleRatio >= 0.6
        """
        today = date.today()
        today_str = str(today)
        expiry_threshold = str(today + timedelta(days=settings.expiry_warning_days))

        resp = self.table.scan()
        alerts = []
        alert_counter = 1

        for raw in resp.get("Items", []):
            item = from_dynamo_decimal(raw)
            eq_id = item.get("EquipmentID")
            check_in = item.get("CheckInDate")
            expected = item.get("ExpectedReturnDate")

            # Check overdue
            if not check_in and expected and expected < today_str:
                alerts.append({
                    "id": alert_counter,
                    "equipment_id": eq_id,
                    "type": "OVERDUE",
                    "severity": "HIGH",
                    "message": f"Asset {eq_id} was expected back on {expected} but has not been returned.",
                    "created_at": item.get("CheckOutDate"),
                    "resolved": False,
                })
                alert_counter += 1

            # Check expiring soon
            elif not check_in and expected and today_str <= expected <= expiry_threshold:
                alerts.append({
                    "id": alert_counter,
                    "equipment_id": eq_id,
                    "type": "EXPIRING_SOON",
                    "severity": "MEDIUM",
                    "message": f"Rental for {eq_id} expires in {(date.fromisoformat(expected) - today).days} days ({expected}).",
                    "created_at": item.get("CheckOutDate"),
                    "resolved": False,
                })
                alert_counter += 1

            # Check anomaly
            engine_h = float(item.get("EngineHoursPerDay") or 0.0)
            idle_h = float(item.get("IdleHoursPerDay") or 0.0)
            tot_h = engine_h + idle_h
            if tot_h > 0:
                idle_ratio = idle_h / tot_h
                if idle_ratio >= settings.idle_ratio_anomaly_threshold:
                    alerts.append({
                        "id": alert_counter,
                        "equipment_id": eq_id,
                        "type": "ANOMALY_IDLE",
                        "severity": "HIGH" if idle_ratio > 0.8 else "MEDIUM",
                        "message": f"Abnormal idle ratio ({idle_ratio:.0%}) detected on {item.get('CheckOutDate')}.",
                        "created_at": item.get("CheckOutDate"),
                        "resolved": False,
                    })
                    alert_counter += 1

        return alerts

    # -------------------------------------------------------------------------
    # FORMATTING HELPERS
    # -------------------------------------------------------------------------

    def _format_equipment(self, item: dict[str, Any]) -> dict[str, Any]:
        data = from_dynamo_decimal(item)
        return {
            "equipment_id": data.get("EquipmentID"),
            "id": data.get("EquipmentID"),
            "type": data.get("Type", "Excavator"),
            "site_id": data.get("SiteID", "Depot"),
            "location": data.get("SiteID", "Depot"),
            "name": data.get("Name") or f"{data.get('Type')} {data.get('EquipmentID')}",
            "model": data.get("Model", "Standard"),
            "serial_number": data.get("SerialNumber", f"SN-{data.get('EquipmentID')}"),
            "client_name": data.get("ClientName"),
            "client": data.get("ClientName") or "—",
            "status": data.get("Status", "Available"),
            "check_out_date": data.get("CheckOutDate"),
            "check_in_date": data.get("CheckInDate"),
            "expected_return_date": data.get("ExpectedReturnDate"),
            "engine_hours_day": float(data.get("EngineHoursPerDay") or 0.0),
            "idle_hours_day": float(data.get("IdleHoursPerDay") or 0.0),
            "operating_days": int(data.get("OperatingDays") or 0),
        }

    def _format_usage_log(self, item: dict[str, Any]) -> dict[str, Any]:
        data = from_dynamo_decimal(item)
        engine_h = float(data.get("EngineHoursPerDay") or 0.0)
        idle_h = float(data.get("IdleHoursPerDay") or 0.0)
        tot_h = engine_h + idle_h
        idle_ratio = round(idle_h / tot_h, 3) if tot_h > 0 else 0.0

        return {
            "id": hash(f"{data.get('EquipmentID')}-{data.get('CheckOutDate')}"),
            "equipment_id": data.get("EquipmentID"),
            "log_date": data.get("CheckOutDate"),
            "engine_hours_day": engine_h,
            "idle_hours_day": idle_h,
            "idle_ratio": idle_ratio,
            "operating_days_cumulative": int(data.get("OperatingDays") or 0),
            "last_operator_id": data.get("LastOperatorID"),
        }
