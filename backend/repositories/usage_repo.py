from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.usage_log import UsageLog


class UsageRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert(
        self,
        equipment_id: str,
        log_date: date,
        engine_hours_day: float,
        idle_hours_day: float,
        operating_days_cumulative: int,
        last_operator_id: str | None,
    ) -> UsageLog:
        stmt = select(UsageLog).where(
            UsageLog.equipment_id == equipment_id, UsageLog.log_date == log_date
        )
        existing = self.db.execute(stmt).scalars().first()
        if existing:
            existing.engine_hours_day = engine_hours_day
            existing.idle_hours_day = idle_hours_day
            existing.operating_days_cumulative = operating_days_cumulative
            existing.last_operator_id = last_operator_id
            self.db.commit()
            self.db.refresh(existing)
            return existing

        log = UsageLog(
            equipment_id=equipment_id,
            log_date=log_date,
            engine_hours_day=engine_hours_day,
            idle_hours_day=idle_hours_day,
            operating_days_cumulative=operating_days_cumulative,
            last_operator_id=last_operator_id,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def history_for_equipment(self, equipment_id: str, days: int = 90) -> list[UsageLog]:
        since = date.today() - timedelta(days=days)
        stmt = (
            select(UsageLog)
            .where(UsageLog.equipment_id == equipment_id, UsageLog.log_date >= since)
            .order_by(UsageLog.log_date.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def history_for_type(self, equipment_type: str, days: int = 180) -> list[UsageLog]:
        """Used by the forecast engine — joins through equipment to filter by type."""
        from models.equipment import Equipment

        since = date.today() - timedelta(days=days)
        stmt = (
            select(UsageLog)
            .join(Equipment, Equipment.equipment_id == UsageLog.equipment_id)
            .where(Equipment.type == equipment_type, UsageLog.log_date >= since)
            .order_by(UsageLog.log_date.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def all_recent(self, days: int = 30) -> list[UsageLog]:
        since = date.today() - timedelta(days=days)
        stmt = select(UsageLog).where(UsageLog.log_date >= since)
        return list(self.db.execute(stmt).scalars().all())
