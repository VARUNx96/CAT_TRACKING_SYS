"""
AI Demand Forecasting API endpoints.
Uses DynamoDB GSI 2 (Type-CheckOutDate-index) for instant category telemetry queries.
"""
from fastapi import APIRouter, Depends

from db.session import get_db
from repositories.dynamo_repository import DynamoRepository
from services.ai.forecast_engine import ForecastEngine
from schemas.forecast import ForecastResponse

router = APIRouter(prefix="/forecast", tags=["forecasting"])


@router.get("/{equipment_type}", response_model=ForecastResponse)
def get_forecast(
    equipment_type: str,
    site_id: str | None = None,
    horizon_days: int = 7,
    db: DynamoRepository = Depends(get_db),
):
    """
    Demand forecast for an equipment type using GSI 2 on DynamoDB.
    """
    logs = db.history_for_type(equipment_type, days=180)
    engine = ForecastEngine(horizon_periods=horizon_days)
    return engine.forecast(equipment_type=equipment_type, site_id=site_id, logs=logs)
