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
    """Primary feed for Fleet Overview and Assets Registry (Optimized batch aggregation)."""
    all_eq = db.list_all_equipment(site_id=site_id, type_=type)
    active_alerts = db.list_active_alerts()
    all_recent_logs = db.all_recent_usage(days=7)

    # Index alerts by equipment_id
    alert_counts: dict[str, int] = {}
    for a in active_alerts:
        eid = a.get("equipment_id")
        if eid:
            alert_counts[eid] = alert_counts.get(eid, 0) + 1

    # Index usage logs by equipment_id
    usage_by_eq: dict[str, list[dict]] = {}
    for log in all_recent_logs:
        eid = log.get("equipment_id")
        if eid:
            usage_by_eq.setdefault(eid, []).append(log)

    rows = []
    for eq in all_eq:
        eq_id = eq["equipment_id"]
        logs = usage_by_eq.get(eq_id, [])

        if logs:
            logs.sort(key=lambda x: str(x.get("log_date", "")))
            total_engine = sum(float(l.get("engine_hours_day") or 0.0) for l in logs)
            total_idle = sum(float(l.get("idle_hours_day") or 0.0) for l in logs)
            possible_hours = len(logs) * 24
            utilization_pct = round((total_engine / possible_hours) * 100, 1) if possible_hours else 0.0
            idle_ratio = round(total_idle / (total_engine + total_idle), 3) if (total_engine + total_idle) else 0.0
            last_operator = logs[-1].get("last_operator_id")
        else:
            utilization_pct = None
            idle_ratio = None
            last_operator = None

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
                utilization_pct_7d=utilization_pct,
                idle_ratio_7d=idle_ratio,
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
