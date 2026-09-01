from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from repositories.equipment_repo import EquipmentRepository
from repositories.checkevent_repo import CheckEventRepository
from repositories.alert_repo import AlertRepository
from services.usage_service import UsageService
from schemas.equipment import EquipmentCreate, EquipmentOut, EquipmentDashboardRow, DashboardSummaryOut
from schemas.checkinout import CheckEventOut
from models.equipment import EquipmentStatus
from models.alert import AlertType

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.post("", response_model=EquipmentOut, status_code=201)
def create_equipment(payload: EquipmentCreate, db: Session = Depends(get_db)):
    repo = EquipmentRepository(db)
    if repo.get(payload.equipment_id):
        raise HTTPException(409, f"Equipment {payload.equipment_id} already exists.")
    return repo.create(
        equipment_id=payload.equipment_id,
        type_=payload.type,
        site_id=payload.site_id,
        name=payload.name,
        model=payload.model,
        serial_number=payload.serial_number,
        client_name=payload.client_name,
    )


@router.get("/stats/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Aggregate fleet KPIs for the Dashboard stats grid."""
    eq_repo = EquipmentRepository(db)
    alert_repo = AlertRepository(db)

    all_eq = eq_repo.list_all()
    active_alerts = alert_repo.list_active()

    rented = sum(1 for e in all_eq if e.status == EquipmentStatus.RENTED)
    available = sum(1 for e in all_eq if e.status == EquipmentStatus.AVAILABLE)
    maintenance = sum(1 for e in all_eq if e.status == EquipmentStatus.MAINTENANCE)
    flagged = sum(1 for e in all_eq if e.status == EquipmentStatus.FLAGGED)

    expiring_soon = sum(1 for a in active_alerts if a.type == AlertType.EXPIRING_SOON)
    overdue = sum(1 for a in active_alerts if a.type == AlertType.OVERDUE)

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
def list_equipment(site_id: str | None = None, type: str | None = None, db: Session = Depends(get_db)):
    """Primary feed for Fleet Overview and Assets Registry."""
    eq_repo = EquipmentRepository(db)
    alert_repo = AlertRepository(db)
    usage_service = UsageService(db)

    rows = []
    for eq in eq_repo.list_all(site_id=site_id, type_=type):
        util = usage_service.utilization_summary(eq.equipment_id, days=7)
        latest_logs = usage_service.usage_repo.history_for_equipment(eq.equipment_id, days=1)
        last_operator = latest_logs[-1].last_operator_id if latest_logs else None

        status_display = {
            EquipmentStatus.AVAILABLE: "Available",
            EquipmentStatus.RENTED: "Rented",
            EquipmentStatus.MAINTENANCE: "Maintenance",
            EquipmentStatus.FLAGGED: "Flagged",
        }.get(eq.status, "Available")

        rows.append(
            EquipmentDashboardRow(
                id=eq.equipment_id,
                equipment_id=eq.equipment_id,
                name=eq.name or f"{eq.type} {eq.equipment_id}",
                model=eq.model or "Standard",
                type=eq.type,
                location=eq.site_id or "HQ Depot",
                site_id=eq.site_id,
                status=status_display,
                client=eq.client_name or "—",
                last_operator_id=last_operator,
                utilization_pct_7d=util["utilization_pct"],
                idle_ratio_7d=util["idle_ratio"],
                active_alert_count=alert_repo.count_active_for_equipment(eq.equipment_id),
            )
        )
    return rows


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: str, db: Session = Depends(get_db)):
    eq = EquipmentRepository(db).get(equipment_id)
    if eq is None:
        raise HTTPException(404, "Equipment not found.")
    return eq


@router.get("/{equipment_id}/timeline", response_model=list[CheckEventOut])
def get_equipment_timeline(equipment_id: str, db: Session = Depends(get_db)):
    """Unified handoff-to-return history — powers the Asset Detail/Timeline screen."""
    events = CheckEventRepository(db).timeline_for_equipment(equipment_id)
    if not events:
        raise HTTPException(404, "No rental history found for this equipment.")
    return events
