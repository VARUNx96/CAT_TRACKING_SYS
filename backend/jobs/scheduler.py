"""
In-process scheduler — audits active rentals and alerts on AWS DynamoDB.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler

from config import settings
from repositories.dynamo_repository import DynamoRepository
from services.rental_service import RentalService

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler()


def job_scan_overdue_and_expiring():
    repo = DynamoRepository()
    created = RentalService(repo).scan_overdue_and_expiring()
    if created:
        logger.info("Overdue/expiring scan found %d alert(s)", len(created))


def job_refresh_anomaly_scan():
    repo = DynamoRepository()
    alerts = repo.list_active_alerts()
    anomalies = [a for a in alerts if "ANOMALY" in str(a.get("type", ""))]
    logger.info("DynamoDB anomaly scan refreshed: %d active anomalies", len(anomalies))


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
    scheduler.start()
    logger.info("Background scheduler started (DynamoDB audit active).")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
