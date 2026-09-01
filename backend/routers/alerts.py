from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from repositories.alert_repo import AlertRepository
from services.rental_service import RentalService
from schemas.alert import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_active_alerts(equipment_id: str | None = None, db: Session = Depends(get_db)):
    """Feeds the Alerts Center screen."""
    return AlertRepository(db).list_active(equipment_id=equipment_id)


@router.post("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = AlertRepository(db).resolve(alert_id)
    if alert is None:
        raise HTTPException(404, "Alert not found.")
    return alert


@router.post("/scan")
def run_overdue_scan(db: Session = Depends(get_db)):
    """
    Manually trigger the overdue/expiring scan (also runs automatically
    via the scheduler). Useful for the live demo to show alerts firing
    on-demand rather than waiting for the schedule.
    """
    created = RentalService(db).scan_overdue_and_expiring()
    return {"alerts_created": created}
