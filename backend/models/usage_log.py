"""
UsageLog domain model.
"""
from dataclasses import dataclass
from datetime import date


@dataclass
class UsageLog:
    equipment_id: str
    log_date: date | str
    engine_hours_day: float = 0.0
    idle_hours_day: float = 0.0
    operating_days_cumulative: int = 0
    last_operator_id: str | None = None
    id: int | None = None

    @property
    def idle_ratio(self) -> float:
        total = self.engine_hours_day + self.idle_hours_day
        if total == 0:
            return 0.0
        return round(self.idle_hours_day / total, 3)
