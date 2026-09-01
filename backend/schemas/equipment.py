from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.equipment import EquipmentStatus


class EquipmentCreate(BaseModel):
    equipment_id: str
    type: str
    site_id: str | None = None
    name: str | None = None
    model: str | None = None
    serial_number: str | None = None
    client_name: str | None = None


class EquipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    equipment_id: str
    name: str | None = None
    model: str | None = None
    serial_number: str | None = None
    client_name: str | None = None
    type: str
    site_id: str | None
    status: EquipmentStatus
    created_at: datetime


class EquipmentDashboardRow(BaseModel):
    """Flattened row for the Fleet Overview & Assets table."""
    id: str
    equipment_id: str
    name: str
    model: str | None = None
    type: str
    location: str
    site_id: str | None
    status: str
    client: str
    last_operator_id: str | None = None
    utilization_pct_7d: float | None = None
    idle_ratio_7d: float | None = None
    active_alert_count: int = 0


class DashboardSummaryOut(BaseModel):
    total_equipment: int
    rented: int
    available: int
    maintenance: int
    flagged: int
    active_alerts: int
    expiring_soon: int
    overdue: int
