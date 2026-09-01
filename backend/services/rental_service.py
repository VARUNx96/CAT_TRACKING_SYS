"""
Rental lifecycle: check-out, check-in, and the overdue/expiring alert scan.
This is the service that makes "every asset traceable from handoff to
return" actually true — every state transition goes through here.
"""
import secrets
from datetime import date, timedelta

from sqlalchemy.orm import Session

from config import settings
from models.equipment import EquipmentStatus
from models.alert import AlertType, AlertSeverity
from repositories.checkevent_repo import CheckEventRepository
from repositories.equipment_repo import EquipmentRepository
from repositories.alert_repo import AlertRepository


class RentalServiceError(Exception):
    pass


class RentalService:
    def __init__(self, db: Session):
        self.db = db
        self.check_repo = CheckEventRepository(db)
        self.equipment_repo = EquipmentRepository(db)
        self.alert_repo = AlertRepository(db)

    def check_out(
        self,
        equipment_id: str,
        check_out_date: date,
        site_id: str | None,
        operator_id: str | None,
        expected_return_date: date | None,
        client_name: str | None = None,
    ):
        equipment = self.equipment_repo.get(equipment_id)
        if equipment is None:
            raise RentalServiceError(f"Unknown equipment_id: {equipment_id}")
        if equipment.status == EquipmentStatus.RENTED:
            raise RentalServiceError(f"{equipment_id} is already checked out.")

        qr_token = secrets.token_urlsafe(12)
        event = self.check_repo.create(
            equipment_id=equipment_id,
            check_out_date=check_out_date,
            site_id=site_id,
            operator_id=operator_id,
            expected_return_date=expected_return_date,
            qr_token=qr_token,
        )
        self.equipment_repo.update_status(equipment_id, EquipmentStatus.RENTED)
        if client_name:
            equipment.client_name = client_name
            self.db.commit()
        return event

    def check_in(self, check_in_date: date, qr_token: str | None = None, equipment_id: str | None = None):
        if qr_token:
            event = self.check_repo.get_by_qr_token(qr_token)
        elif equipment_id:
            event = self.check_repo.get_active_by_equipment(equipment_id)
        else:
            raise RentalServiceError("Provide either qr_token or equipment_id.")

        if event is None or not event.is_active:
            raise RentalServiceError("No active rental found for this asset/token.")

        closed = self.check_repo.close(event, check_in_date)
        self.equipment_repo.update_status(closed.equipment_id, EquipmentStatus.AVAILABLE)
        eq = self.equipment_repo.get(closed.equipment_id)
        if eq:
            eq.client_name = None
            self.db.commit()
        return closed

    def asset_timeline(self, equipment_id: str):
        """Full handoff-to-return history for one asset — powers the Asset Detail/Timeline view."""
        return self.check_repo.timeline_for_equipment(equipment_id)

    def scan_overdue_and_expiring(self) -> list[dict]:
        """
        Run by the scheduler (and callable on-demand). For every active
        rental: raise OVERDUE if past expected_return_date, or
        EXPIRING_SOON if within the warning window. Idempotent — skips
        equipment that already has an unresolved alert of that type.
        """
        today = date.today()
        created = []

        for event in self.check_repo.list_active():
            if not event.expected_return_date:
                continue

            days_over = (today - event.expected_return_date).days

            if days_over > settings.overdue_grace_days:
                if not self.alert_repo.exists_unresolved(event.equipment_id, AlertType.OVERDUE):
                    alert = self.alert_repo.create(
                        equipment_id=event.equipment_id,
                        type_=AlertType.OVERDUE,
                        severity=AlertSeverity.HIGH,
                        message=(
                            f"{event.equipment_id} is {days_over} day(s) overdue "
                            f"(expected back {event.expected_return_date})."
                        ),
                    )
                    self.equipment_repo.update_status(event.equipment_id, EquipmentStatus.FLAGGED)
                    created.append({"equipment_id": event.equipment_id, "type": "overdue"})

            elif 0 <= -days_over <= settings.expiry_warning_days:
                if not self.alert_repo.exists_unresolved(event.equipment_id, AlertType.EXPIRING_SOON):
                    days_left = -days_over
                    alert = self.alert_repo.create(
                        equipment_id=event.equipment_id,
                        type_=AlertType.EXPIRING_SOON,
                        severity=AlertSeverity.MEDIUM,
                        message=(
                            f"{event.equipment_id} rental ends in {days_left} day(s) "
                            f"({event.expected_return_date}) — confirm return or extend."
                        ),
                    )
                    created.append({"equipment_id": event.equipment_id, "type": "expiring_soon"})

        return created
