from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.check_event import CheckEvent


class CheckEventRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        equipment_id: str,
        check_out_date: date,
        site_id: str | None,
        operator_id: str | None,
        expected_return_date: date | None,
        qr_token: str | None,
    ) -> CheckEvent:
        ev = CheckEvent(
            equipment_id=equipment_id,
            site_id=site_id,
            operator_id=operator_id,
            check_out_date=check_out_date,
            expected_return_date=expected_return_date,
            qr_token=qr_token,
        )
        self.db.add(ev)
        self.db.commit()
        self.db.refresh(ev)
        return ev

    def get_active_by_equipment(self, equipment_id: str) -> CheckEvent | None:
        stmt = (
            select(CheckEvent)
            .where(CheckEvent.equipment_id == equipment_id, CheckEvent.check_in_date.is_(None))
            .order_by(CheckEvent.check_out_date.desc())
        )
        return self.db.execute(stmt).scalars().first()

    def get_by_qr_token(self, qr_token: str) -> CheckEvent | None:
        stmt = select(CheckEvent).where(CheckEvent.qr_token == qr_token)
        return self.db.execute(stmt).scalars().first()

    def list_active(self) -> list[CheckEvent]:
        stmt = select(CheckEvent).where(CheckEvent.check_in_date.is_(None))
        return list(self.db.execute(stmt).scalars().all())

    def close(self, check_event: CheckEvent, check_in_date: date) -> CheckEvent:
        check_event.check_in_date = check_in_date
        self.db.commit()
        self.db.refresh(check_event)
        return check_event

    def timeline_for_equipment(self, equipment_id: str) -> list[CheckEvent]:
        stmt = (
            select(CheckEvent)
            .where(CheckEvent.equipment_id == equipment_id)
            .order_by(CheckEvent.check_out_date.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
