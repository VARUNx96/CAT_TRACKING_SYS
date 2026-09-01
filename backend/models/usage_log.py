from datetime import date, datetime

from sqlalchemy import String, Date, DateTime, Float, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class UsageLog(Base):
    """
    Daily telemetry/usage snapshot per asset. One row per equipment per day.
    This is the table forecasting, anomaly detection, and utilization
    calculations all read from.
    """
    __tablename__ = "usage_log"
    __table_args__ = (UniqueConstraint("equipment_id", "log_date", name="uq_equipment_day"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    log_date: Mapped[date] = mapped_column(Date, index=True)

    engine_hours_day: Mapped[float] = mapped_column(Float, default=0.0)
    idle_hours_day: Mapped[float] = mapped_column(Float, default=0.0)
    operating_days_cumulative: Mapped[int] = mapped_column(Integer, default=0)
    last_operator_id: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="usage_logs")

    @property
    def idle_ratio(self) -> float:
        total = self.engine_hours_day + self.idle_hours_day
        return round(self.idle_hours_day / total, 3) if total > 0 else 0.0
