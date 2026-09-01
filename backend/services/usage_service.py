"""
Usage logging + utilization metrics.
Exclusively powered by AWS DynamoDB (SmartRentalTracking).
"""
from datetime import date
from typing import Any

from repositories.dynamo_repository import DynamoRepository
from services.ai.anomaly_detector import AnomalyDetector
from models.usage_log import UsageLog


class UsageService:
    def __init__(self, repo: DynamoRepository):
        self.repo = repo
        self.anomaly_detector = AnomalyDetector()

    def log_usage(
        self,
        equipment_id: str,
        log_date: date,
        engine_hours_day: float,
        idle_hours_day: float,
        operating_days_cumulative: int,
        last_operator_id: str | None,
    ) -> UsageLog:
        self.repo.upsert_usage(
            equipment_id=equipment_id,
            log_date=log_date,
            engine_hours_day=engine_hours_day,
            idle_hours_day=idle_hours_day,
            operating_days_cumulative=operating_days_cumulative,
            last_operator_id=last_operator_id,
        )

        log_obj = UsageLog(
            id=hash(f"{equipment_id}-{log_date}"),
            equipment_id=equipment_id,
            log_date=log_date,
            engine_hours_day=engine_hours_day,
            idle_hours_day=idle_hours_day,
            operating_days_cumulative=operating_days_cumulative,
            last_operator_id=last_operator_id,
        )
        return log_obj

    def utilization_summary(self, equipment_id: str, days: int = 7) -> dict:
        logs = self.repo.history_for_equipment(equipment_id, days=days)
        if not logs:
            return {"utilization_pct": None, "idle_ratio": None, "days_counted": 0}

        total_engine = sum(l["engine_hours_day"] for l in logs)
        total_idle = sum(l["idle_hours_day"] for l in logs)
        possible_hours = len(logs) * 24
        utilization_pct = round((total_engine / possible_hours) * 100, 1) if possible_hours else 0.0
        idle_ratio = round(total_idle / (total_engine + total_idle), 3) if (total_engine + total_idle) else 0.0

        return {
            "utilization_pct": utilization_pct,
            "idle_ratio": idle_ratio,
            "days_counted": len(logs),
            "total_engine_hours": total_engine,
            "total_idle_hours": total_idle,
        }
