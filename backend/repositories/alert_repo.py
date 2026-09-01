from sqlalchemy import select
from sqlalchemy.orm import Session

from models.alert import Alert, AlertType, AlertSeverity


class AlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        equipment_id: str,
        type_: AlertType,
        message: str,
        severity: AlertSeverity = AlertSeverity.MEDIUM,
        confidence: float | None = None,
    ) -> Alert:
        alert = Alert(
            equipment_id=equipment_id,
            type=type_,
            severity=severity,
            message=message,
            confidence=confidence,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def exists_unresolved(self, equipment_id: str, type_: AlertType) -> bool:
        stmt = select(Alert).where(
            Alert.equipment_id == equipment_id, Alert.type == type_, Alert.resolved.is_(False)
        )
        return self.db.execute(stmt).scalars().first() is not None

    def list_active(self, equipment_id: str | None = None) -> list[Alert]:
        stmt = select(Alert).where(Alert.resolved.is_(False))
        if equipment_id:
            stmt = stmt.where(Alert.equipment_id == equipment_id)
        stmt = stmt.order_by(Alert.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())

    def resolve(self, alert_id: int) -> Alert | None:
        alert = self.db.get(Alert, alert_id)
        if alert is None:
            return None
        alert.resolved = True
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def count_active_for_equipment(self, equipment_id: str) -> int:
        return len(self.list_active(equipment_id))
