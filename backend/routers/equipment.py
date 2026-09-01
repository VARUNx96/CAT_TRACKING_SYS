"""
Equipment & fleet registry API endpoints.
Exclusively powered by AWS DynamoDB.
"""
from fastapi import APIRouter, Depends, HTTPException

from db.session import get_db
from repositories.dynamo_repository import DynamoRepository
from services.usage_service import UsageService
from schemas.equipment import EquipmentCreate, EquipmentOut, EquipmentDashboardRow, DashboardSummaryOut
from schemas.checkinout import CheckEventOut

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.post("", response_model=EquipmentOut, status_code=201)
def create_equipment(payload: EquipmentCreate, db: DynamoRepository = Depends(get_db)):
    if db.get_equipment(payload.equipment_id):
        raise HTTPException(409, f"Equipment {payload.equipment_id} already exists.")
    return db.create_or_update_equipment(
        equipment_id=payload.equipment_id,
        type_=payload.type,
        site_id=payload.site_id,
        name=payload.name,
        model=payload.model,
        serial_number=payload.serial_number,
        client_name=payload.client_name,
    )


@router.get("/stats/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: DynamoRepository = Depends(get_db)):
    """Aggregate fleet KPIs for the Dashboard stats grid."""
    all_eq = db.list_all_equipment()
    active_alerts = db.list_active_alerts()

    rented = sum(1 for e in all_eq if e.get("status") == "Rented")
    available = sum(1 for e in all_eq if e.get("status") == "Available")
    maintenance = sum(1 for e in all_eq if e.get("status") == "Maintenance")
    flagged = sum(1 for e in all_eq if e.get("status") == "Flagged")

    expiring_soon = sum(1 for a in active_alerts if a.get("type") == "EXPIRING_SOON")
    overdue = sum(1 for a in active_alerts if a.get("type") == "OVERDUE")

    return DashboardSummaryOut(
        total_equipment=len(all_eq),
        rented=rented,
        available=available,
        maintenance=maintenance,
        flagged=flagged,
        active_alerts=len(active_alerts),
        expiring_soon=expiring_soon,
        overdue=overdue,
    )


@router.get("", response_model=list[EquipmentDashboardRow])
def list_equipment(site_id: str | None = None, type: str | None = None, db: DynamoRepository = Depends(get_db)):
    """Primary feed for Fleet Overview and Assets Registry."""
    usage_service = UsageService(db)
    active_alerts = db.list_active_alerts()

    alert_counts: dict[str, int] = {}
    for a in active_alerts:
        eid = a.get("equipment_id")
        if eid:
            alert_counts[eid] = alert_counts.get(eid, 0) + 1

    rows = []
    for eq in db.list_all_equipment(site_id=site_id, type_=type):
        eq_id = eq["equipment_id"]
        util = usage_service.utilization_summary(eq_id, days=7)
        recent_logs = db.history_for_equipment(eq_id, days=1)
        last_operator = recent_logs[-1]["last_operator_id"] if recent_logs else None

        rows.append(
            EquipmentDashboardRow(
                id=eq_id,
                equipment_id=eq_id,
                name=eq.get("name") or f"{eq.get('type')} {eq_id}",
                model=eq.get("model") or "Standard",
                type=eq.get("type"),
                location=eq.get("site_id") or "HQ Depot",
                site_id=eq.get("site_id"),
                status=eq.get("status") or "Available",
                client=eq.get("client_name") or "—",
                last_operator_id=last_operator,
                utilization_pct_7d=util["utilization_pct"],
                idle_ratio_7d=util["idle_ratio"],
                active_alert_count=alert_counts.get(eq_id, 0),
            )
        )
    return rows


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: str, db: DynamoRepository = Depends(get_db)):
    eq = db.get_equipment(equipment_id)
    if eq is None:
        raise HTTPException(404, "Equipment not found.")
    return eq


@router.get("/{equipment_id}/timeline", response_model=list[CheckEventOut])
def get_equipment_timeline(equipment_id: str, db: DynamoRepository = Depends(get_db)):
    """Unified handoff-to-return history — powers the Asset Detail/Timeline screen."""
    events = db.timeline(equipment_id)
    if not events:
        raise HTTPException(404, "No rental history found for this equipment.")
    formatted = []
    for ev in events:
        formatted.append({
            "id": hash(f"{ev.get('EquipmentID')}-{ev.get('CheckOutDate')}"),
            "equipment_id": ev.get("EquipmentID"),
            "site_id": ev.get("SiteID"),
            "operator_id": ev.get("LastOperatorID"),
            "check_out_date": ev.get("CheckOutDate"),
            "expected_return_date": ev.get("ExpectedReturnDate"),
            "check_in_date": ev.get("CheckInDate"),
            "qr_token": ev.get("QRToken"),
            "is_active": ev.get("CheckInDate") is None,
        })
    return formatted
