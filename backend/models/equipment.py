"""
Equipment domain model and status enum.
"""
from dataclasses import dataclass
from enum import Enum


class EquipmentStatus(str, Enum):
    AVAILABLE = "Available"
    RENTED = "Rented"
    MAINTENANCE = "Maintenance"
    FLAGGED = "Flagged"


@dataclass
class Equipment:
    equipment_id: str
    type: str
    site_id: str | None = None
    status: EquipmentStatus = EquipmentStatus.AVAILABLE
    name: str | None = None
    model: str | None = None
    serial_number: str | None = None
    client_name: str | None = None
