from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.alert import AlertType, AlertSeverity


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    equipment_id: str
    type: AlertType
    severity: AlertSeverity
    message: str
    confidence: float | None
    resolved: bool
    created_at: datetime
