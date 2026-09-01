from datetime import date, datetime

from sqlalchemy import String, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class CheckEvent(Base):
    """
    One row per rental cycle for an asset: the handoff-to-return record
    that anchors full traceability. check_in_date is NULL while the
    asset is still out — that's how we identify "currently rented".
    """
    __tablename__ = "check_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    equipment_id: Mapped[str] = mapped_column(ForeignKey("equipment.equipment_id"), index=True)
    site_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    operator_id: Mapped[str | None] = mapped_column(String(20), nullable=True)

    check_out_date: Mapped[date] = mapped_column(Date)
    expected_return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    check_in_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    qr_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    equipment = relationship("Equipment", back_populates="check_events")

    @property
    def is_active(self) -> bool:
        return self.check_in_date is None
