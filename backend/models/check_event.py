"""
CheckEvent domain model.
"""
from dataclasses import dataclass
from datetime import date


@dataclass
class CheckEvent:
    equipment_id: str
    check_out_date: date | str
    site_id: str | None = None
    operator_id: str | None = None
    expected_return_date: date | str | None = None
    check_in_date: date | str | None = None
    qr_token: str | None = None
    id: int | None = None

    @property
    def is_active(self) -> bool:
        return self.check_in_date is None
