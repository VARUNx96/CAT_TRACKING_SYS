"""
In-process scheduler — no separate infra needed for a hackathon deploy.
Runs inside the same FastAPI process via APScheduler's background thread.

Jobs:
  - scan_overdue_and_expiring  : creates OVERDUE / EXPIRING_SOON alerts
  - refresh_anomaly_scan       : re-runs anomaly detection over recent logs
                                  (catches anomalies from batch-imported data,
                                  not just live single-record submissions)
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from db.session import session_scope
from services.rental_service import RentalService
from repositories.usage_repo import UsageRepository
from repositories.alert_repo import AlertRepository
from services.ai.anomaly_detector import AnomalyDetector
from models.alert import AlertType, AlertSeverity

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler()


def job_scan_overdue_and_expiring():
    with session_scope() as db:
        created = RentalService(db).scan_overdue_and_expiring()
        if created:
            logger.info("Overdue/expiring scan created %d alert(s): %s", len(created), created)


def job_refresh_anomaly_scan():
    with session_scope() as db:
        usage_repo = UsageRepository(db)
        alert_repo = AlertRepository(db)
        detector = AnomalyDetector()

        logs = usage_repo.all_recent(days=14)
        results = [r for r in detector.detect(logs) if r.is_anomaly]

        new_count = 0
        for r in results:
            if not alert_repo.exists_unresolved(r.equipment_id, AlertType.ANOMALY):
                severity = AlertSeverity.HIGH if r.anomaly_score >= 0.7 else AlertSeverity.MEDIUM
                alert_repo.create(
                    equipment_id=r.equipment_id,
                    type_=AlertType.ANOMALY,
                    severity=severity,
                    message=f"Anomaly detected on {r.log_date}: {', '.join(r.reason_codes)}.",
                    confidence=r.confidence,
                )
                new_count += 1
        if new_count:
            logger.info("Anomaly scan created %d new alert(s).", new_count)


def start_scheduler():
    if not settings.scheduler_enabled:
        logger.info("Scheduler disabled via config.")
        return

    scheduler.add_job(
        job_scan_overdue_and_expiring,
        "interval",
        minutes=settings.alert_scan_interval_minutes,
        id="overdue_scan",
        replace_existing=True,
    )
    scheduler.add_job(
        job_refresh_anomaly_scan,
        "interval",
        minutes=settings.alert_scan_interval_minutes,
        id="anomaly_scan",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — jobs run every %d minute(s).", settings.alert_scan_interval_minutes)


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
