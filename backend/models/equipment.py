import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.session import Base


class EquipmentStatus(str, enum.Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"
    FLAGGED = "flagged"  # under anomaly investigation


class Equipment(Base):
    """Master asset record — one row per physical machine."""
    __tablename__ = "equipment"

    equipment_id: Mapped[str] = mapped_column(String(20), primary_key=True)  # e.g. EQX1001, CAT-320-01
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)     # e.g. Excavator 320
    model: Mapped[str | None] = mapped_column(String(50), nullable=True)      # e.g. 320 GC
    serial_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(100), nullable=True) # e.g. ABC Construction
    type: Mapped[str] = mapped_column(String(50), index=True)                # Excavator, Bulldozer, Crane...
    site_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    status: Mapped[EquipmentStatus] = mapped_column(
        Enum(EquipmentStatus), default=EquipmentStatus.AVAILABLE, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    check_events = relationship("CheckEvent", back_populates="equipment", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="equipment", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="equipment", cascade="all, delete-orphan")
