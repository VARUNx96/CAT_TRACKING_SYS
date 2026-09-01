"""
Usage logging + utilization/idle metrics + wiring usage events into the
AnomalyDetector so anomalies surface as Alerts immediately on ingest,
not just on the next scheduled scan.
"""
from datetime import date

from sqlalchemy.orm import Session

from models.alert import AlertType, AlertSeverity
from repositories.usage_repo import UsageRepository
from repositories.alert_repo import AlertRepository
from services.ai.anomaly_detector import AnomalyDetector


class UsageService:
    def __init__(self, db: Session):
        self.db = db
        self.usage_repo = UsageRepository(db)
        self.alert_repo = AlertRepository(db)
        self.anomaly_detector = AnomalyDetector()

    def log_usage(
        self,
        equipment_id: str,
        log_date: date,
        engine_hours_day: float,
        idle_hours_day: float,
        operating_days_cumulative: int,
        last_operator_id: str | None,
    ):
        log = self.usage_repo.upsert(
            equipment_id=equipment_id,
            log_date=log_date,
            engine_hours_day=engine_hours_day,
            idle_hours_day=idle_hours_day,
            operating_days_cumulative=operating_days_cumulative,
            last_operator_id=last_operator_id,
        )

        # Real-time anomaly check on every new/updated log entry.
        result = self.anomaly_detector.detect_single(log)
        if result.is_anomaly and not self.alert_repo.exists_unresolved(equipment_id, AlertType.ANOMALY):
            severity = AlertSeverity.HIGH if result.anomaly_score >= 0.7 else AlertSeverity.MEDIUM
            self.alert_repo.create(
                equipment_id=equipment_id,
                type_=AlertType.ANOMALY,
                severity=severity,
                message=f"Anomaly detected on {log_date}: {', '.join(result.reason_codes)}.",
                confidence=result.confidence,
            )

        return log

    def utilization_summary(self, equipment_id: str, days: int = 7) -> dict:
        logs = self.usage_repo.history_for_equipment(equipment_id, days=days)
        if not logs:
            return {"utilization_pct": None, "idle_ratio": None, "days_counted": 0}

        total_engine = sum(l.engine_hours_day for l in logs)
        total_idle = sum(l.idle_hours_day for l in logs)
        possible_hours = len(logs) * 24
        utilization_pct = round((total_engine / possible_hours) * 100, 1) if possible_hours else 0.0
        idle_ratio = round(total_idle / (total_engine + total_idle), 3) if (total_engine + total_idle) else 0.0

        return {
            "utilization_pct": utilization_pct,
            "idle_ratio": idle_ratio,
            "days_counted": len(logs),
        }
