"""
Rental lifecycle: check-out, check-in, and the overdue/expiring alert scan.
Exclusively powered by AWS DynamoDB (SmartRentalTracking).
"""
import secrets
from datetime import date
from typing import Any

from repositories.dynamo_repository import DynamoRepository


class RentalServiceError(Exception):
    pass


class RentalService:
    def __init__(self, repo: DynamoRepository):
        self.repo = repo

    def check_out(
        self,
        equipment_id: str,
        check_out_date: date,
        site_id: str | None,
        operator_id: str | None,
        expected_return_date: date | None,
        client_name: str | None = None,
    ) -> dict[str, Any]:
        equipment = self.repo.get_equipment(equipment_id)
        if equipment is None:
            raise RentalServiceError(f"Unknown equipment_id: {equipment_id}")
        if equipment.get("status") == "Rented":
            raise RentalServiceError(f"{equipment_id} is already checked out.")

        qr_token = secrets.token_urlsafe(12)
        event = self.repo.create_checkout(
            equipment_id=equipment_id,
            check_out_date=check_out_date,
            site_id=site_id or equipment.get("site_id"),
            operator_id=operator_id,
            expected_return_date=expected_return_date,
            qr_token=qr_token,
            client_name=client_name,
            type_=equipment.get("type"),
        )
        return {
            "id": hash(f"{equipment_id}-{check_out_date}"),
            "equipment_id": equipment_id,
            "site_id": site_id,
            "operator_id": operator_id,
            "check_out_date": check_out_date,
            "expected_return_date": expected_return_date,
            "check_in_date": None,
            "qr_token": qr_token,
            "is_active": True,
        }

    def check_in(self, check_in_date: date, qr_token: str | None = None, equipment_id: str | None = None) -> dict[str, Any]:
        if qr_token:
            event = self.repo.get_by_qr_token(qr_token)
        elif equipment_id:
            event = self.repo.get_active_checkout(equipment_id)
        else:
            raise RentalServiceError("Provide either qr_token or equipment_id.")

        if event is None:
            raise RentalServiceError("No active rental found for this asset/token.")

        eq_id = event.get("EquipmentID") or event.get("equipment_id")
        co_date = event.get("CheckOutDate") or event.get("check_out_date")

        closed = self.repo.close_checkout(
            equipment_id=eq_id,
            check_out_date=co_date,
            check_in_date=check_in_date,
        )
        return {
            "id": hash(f"{eq_id}-{co_date}"),
            "equipment_id": eq_id,
            "site_id": event.get("SiteID"),
            "operator_id": event.get("LastOperatorID"),
            "check_out_date": co_date,
            "expected_return_date": event.get("ExpectedReturnDate"),
            "check_in_date": check_in_date,
            "qr_token": event.get("QRToken"),
            "is_active": False,
        }

    def asset_timeline(self, equipment_id: str) -> list[dict[str, Any]]:
        """Full handoff-to-return history for one asset."""
        raw_items = self.repo.timeline(equipment_id)
        timeline = []
        for it in raw_items:
            timeline.append({
                "id": hash(f"{it.get('EquipmentID')}-{it.get('CheckOutDate')}"),
                "equipment_id": it.get("EquipmentID"),
                "site_id": it.get("SiteID"),
                "operator_id": it.get("LastOperatorID"),
                "check_out_date": it.get("CheckOutDate"),
                "expected_return_date": it.get("ExpectedReturnDate"),
                "check_in_date": it.get("CheckInDate"),
                "qr_token": it.get("QRToken"),
                "is_active": it.get("CheckInDate") is None,
            })
        return timeline

    def scan_overdue_and_expiring(self) -> list[dict]:
        """Audits active rentals and flags overdue/expiring items."""
        alerts = self.repo.list_active_alerts()
        return [{"equipment_id": a["equipment_id"], "type": a["type"]} for a in alerts]
