"""
Centralized app configuration, loaded from environment variables / .env.
Keeping this separate means services never hardcode thresholds or DB URLs.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./rental.db"

    # Business rule thresholds — surfaced here so they're easy to tune
    # without touching service logic.
    overdue_grace_days: int = 0
    expiry_warning_days: int = 3
    idle_ratio_anomaly_threshold: float = 0.6  # idle_hours / (idle+engine) hours

    # Scheduler
    scheduler_enabled: bool = True
    alert_scan_interval_minutes: int = 60
    forecast_refresh_interval_hours: int = 24


settings = Settings()
