"""
Alert domain model and enums.
"""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    OVERDUE = "OVERDUE"
    EXPIRING_SOON = "EXPIRING_SOON"
    ANOMALY_IDLE = "ANOMALY_IDLE"
    ANOMALY_HOURS = "ANOMALY_HOURS"
    ANOMALY = "ANOMALY"
    MAINTENANCE_DUE = "MAINTENANCE_DUE"


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass
class Alert:
    id: int
    equipment_id: str
    type: AlertType
    severity: AlertSeverity
    message: str
    confidence: float | None = None
    created_at: datetime | str | None = None
    resolved: bool = False
    resolved_at: datetime | str | None = None
