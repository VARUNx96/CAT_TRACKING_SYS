from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from services.usage_service import UsageService
from schemas.usage import UsageLogCreate, UsageLogOut

router = APIRouter(prefix="/usage", tags=["usage logging"])


@router.post("", response_model=UsageLogOut, status_code=201)
def log_usage(payload: UsageLogCreate, db: Session = Depends(get_db)):
    service = UsageService(db)
    log = service.log_usage(
        equipment_id=payload.equipment_id,
        log_date=payload.log_date,
        engine_hours_day=payload.engine_hours_day,
        idle_hours_day=payload.idle_hours_day,
        operating_days_cumulative=payload.operating_days_cumulative,
        last_operator_id=payload.last_operator_id,
    )
    return UsageLogOut(
        id=log.id,
        equipment_id=log.equipment_id,
        log_date=log.log_date,
        engine_hours_day=log.engine_hours_day,
        idle_hours_day=log.idle_hours_day,
        operating_days_cumulative=log.operating_days_cumulative,
        last_operator_id=log.last_operator_id,
        idle_ratio=log.idle_ratio,
    )


@router.get("/{equipment_id}", response_model=list[UsageLogOut])
def get_usage_history(equipment_id: str, days: int = 30, db: Session = Depends(get_db)):
    service = UsageService(db)
    logs = service.usage_repo.history_for_equipment(equipment_id, days=days)
    return [
        UsageLogOut(
            id=l.id, equipment_id=l.equipment_id, log_date=l.log_date,
            engine_hours_day=l.engine_hours_day, idle_hours_day=l.idle_hours_day,
            operating_days_cumulative=l.operating_days_cumulative,
            last_operator_id=l.last_operator_id, idle_ratio=l.idle_ratio,
        )
        for l in logs
    ]


@router.get("/{equipment_id}/utilization")
def get_utilization(equipment_id: str, days: int = 7, db: Session = Depends(get_db)):
    return UsageService(db).utilization_summary(equipment_id, days=days)
