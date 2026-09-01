from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class UsageLogCreate(BaseModel):
    equipment_id: str
    log_date: date
    engine_hours_day: float = Field(ge=0, le=24)
    idle_hours_day: float = Field(ge=0, le=24)
    operating_days_cumulative: int = Field(ge=0)
    last_operator_id: str | None = None


class UsageLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    log_date: date
    engine_hours_day: float
    idle_hours_day: float
    operating_days_cumulative: int
    last_operator_id: str | None
    idle_ratio: float
