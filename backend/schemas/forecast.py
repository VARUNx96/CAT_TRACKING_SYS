from pydantic import BaseModel


class ForecastPoint(BaseModel):
    period: str          # e.g. "2026-09-08" (week-starting) or "2026-09"
    predicted_demand: float
    confidence_low: float
    confidence_high: float


class ForecastResponse(BaseModel):
    equipment_type: str
    site_id: str | None
    horizon_periods: int
    method: str           # "moving_average" | "exponential_smoothing" | "linear_trend"
    points: list[ForecastPoint]
    recommendation: str    # human-readable relocation/allocation suggestion
