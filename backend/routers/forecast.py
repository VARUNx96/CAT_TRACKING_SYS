from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from repositories.usage_repo import UsageRepository
from services.ai.forecast_engine import ForecastEngine
from schemas.forecast import ForecastResponse

router = APIRouter(prefix="/forecast", tags=["forecasting"])


@router.get("/{equipment_type}", response_model=ForecastResponse)
def get_forecast(
    equipment_type: str,
    site_id: str | None = None,
    horizon_days: int = 7,
    db: Session = Depends(get_db),
):
    """
    Demand forecast for an equipment type (optionally scoped to a site),
    used by the Forecast & Planning dashboard view to drive fleet
    repositioning decisions.
    """
    usage_repo = UsageRepository(db)
    logs = usage_repo.history_for_type(equipment_type, days=180)
    if site_id:
        logs = [l for l in logs if l.equipment and l.equipment.site_id == site_id]

    engine = ForecastEngine(horizon_periods=horizon_days)
    return engine.forecast(equipment_type=equipment_type, site_id=site_id, logs=logs)
