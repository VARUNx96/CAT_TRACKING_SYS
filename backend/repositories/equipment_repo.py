from sqlalchemy import select
from sqlalchemy.orm import Session

from models.equipment import Equipment, EquipmentStatus


class EquipmentRepository:
    """All raw DB access for Equipment lives here — services never touch SQLAlchemy directly."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, equipment_id: str) -> Equipment | None:
        return self.db.get(Equipment, equipment_id)

    def list_all(self, site_id: str | None = None, type_: str | None = None) -> list[Equipment]:
        stmt = select(Equipment)
        if site_id:
            stmt = stmt.where(Equipment.site_id == site_id)
        if type_:
            stmt = stmt.where(Equipment.type == type_)
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        equipment_id: str,
        type_: str,
        site_id: str | None = None,
        name: str | None = None,
        model: str | None = None,
        serial_number: str | None = None,
        client_name: str | None = None,
    ) -> Equipment:
        eq = Equipment(
            equipment_id=equipment_id,
            type=type_,
            site_id=site_id,
            name=name or f"{type_} {equipment_id}",
            model=model,
            serial_number=serial_number,
            client_name=client_name,
        )
        self.db.add(eq)
        self.db.commit()
        self.db.refresh(eq)
        return eq

    def update_status(self, equipment_id: str, status: EquipmentStatus) -> Equipment | None:
        eq = self.get(equipment_id)
        if eq is None:
            return None
        eq.status = status
        self.db.commit()
        self.db.refresh(eq)
        return eq
