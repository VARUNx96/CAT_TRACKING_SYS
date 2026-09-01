"""
Demand Forecasting.

Design choice: with daily-granularity data and a handful of records per
asset (hackathon dataset), a heavy model (Prophet/LSTM) would overfit and
is hard to defend under judge questioning. Instead we use transparent,
classical methods that are explainable in one sentence and still produce
a genuinely useful forecast + confidence band:

  - >= 14 data points  -> Holt's linear exponential smoothing (captures trend)
  - 5-13 data points   -> simple moving-average projection
  - < 5 data points    -> flat baseline (insufficient-history fallback)

Input:  historical UsageLog rows for an equipment TYPE (optionally site-scoped),
         aggregated into a daily "active demand" series (count of assets in use).
Output: N-period-ahead forecast with confidence interval + a plain-English
         relocation/allocation recommendation.
"""
from datetime import date, timedelta
from typing import Any

import numpy as np

from models.usage_log import UsageLog
from schemas.forecast import ForecastPoint, ForecastResponse


class ForecastEngine:
    def __init__(self, horizon_periods: int = 7):
        self.horizon_periods = horizon_periods

    def _build_daily_series(self, logs: list[Any]) -> list[float]:
        """Aggregate raw usage logs into one 'demand' value per day: count of
        assets with engine_hours_day > 0, i.e. actually rented/in-use that day."""
        by_day: dict[date, int] = {}
        for log in logs:
            eng_h = log.engine_hours_day if hasattr(log, "engine_hours_day") else (log.get("engine_hours_day") or 0.0)
            log_d = log.log_date if hasattr(log, "log_date") else log.get("log_date")
            if eng_h > 0 and log_d:
                if isinstance(log_d, str):
                    try:
                        log_d = date.fromisoformat(log_d)
                    except Exception:
                        continue
                by_day[log_d] = by_day.get(log_d, 0) + 1
        if not by_day:
            return []
        days = sorted(by_day.keys())
        full_range = [days[0] + timedelta(days=i) for i in range((days[-1] - days[0]).days + 1)]
        return [by_day.get(d, 0) for d in full_range]

    def _holt_linear(self, series: list[float], alpha: float = 0.4, beta: float = 0.2) -> tuple[list[float], float]:
        """Holt's linear trend method. Returns (forecast_points, residual_std)."""
        level, trend = series[0], series[1] - series[0]
        fitted = [level]
        for y in series[1:]:
            last_level = level
            level = alpha * y + (1 - alpha) * (level + trend)
            trend = beta * (level - last_level) + (1 - beta) * trend
            fitted.append(level)

        residuals = np.array(series) - np.array(fitted)
        resid_std = float(np.std(residuals)) if len(residuals) > 1 else max(1.0, level * 0.2)

        forecast = [level + (i + 1) * trend for i in range(self.horizon_periods)]
        forecast = [max(0.0, f) for f in forecast]
        return forecast, resid_std

    def _moving_average(self, series: list[float], window: int = 5) -> tuple[list[float], float]:
        window = min(window, len(series))
        avg = float(np.mean(series[-window:]))
        resid_std = float(np.std(series[-window:])) if window > 1 else max(1.0, avg * 0.3)
        return [avg] * self.horizon_periods, resid_std

    def forecast(self, equipment_type: str, site_id: str | None, logs: list[UsageLog]) -> ForecastResponse:
        series = self._build_daily_series(logs)

        if len(series) >= 14:
            method = "exponential_smoothing"
            preds, resid_std = self._holt_linear(series)
        elif len(series) >= 5:
            method = "moving_average"
            preds, resid_std = self._moving_average(series)
        else:
            method = "insufficient_history_baseline"
            baseline = float(series[-1]) if series else 1.0
            preds, resid_std = [baseline] * self.horizon_periods, max(1.0, baseline * 0.3)

        start = date.today() + timedelta(days=1)
        points = [
            ForecastPoint(
                period=str(start + timedelta(days=i)),
                predicted_demand=round(p, 2),
                confidence_low=round(max(0.0, p - 1.28 * resid_std), 2),   # ~80% band
                confidence_high=round(p + 1.28 * resid_std, 2),
            )
            for i, p in enumerate(preds)
        ]

        recommendation = self._build_recommendation(equipment_type, site_id, points)

        return ForecastResponse(
            equipment_type=equipment_type,
            site_id=site_id,
            horizon_periods=self.horizon_periods,
            method=method,
            points=points,
            recommendation=recommendation,
        )

    @staticmethod
    def _build_recommendation(equipment_type: str, site_id: str | None, points: list[ForecastPoint]) -> str:
        if not points:
            return f"Not enough usage history yet to forecast {equipment_type} demand."
        peak = max(p.predicted_demand for p in points)
        avg = np.mean([p.predicted_demand for p in points])
        location = f" at site {site_id}" if site_id else ""
        if peak > avg * 1.3:
            return (
                f"Demand for {equipment_type}{location} is trending up, "
                f"peaking near {peak:.1f} units/day. Consider pre-positioning "
                f"additional units before the peak period."
            )
        return (
            f"Demand for {equipment_type}{location} is expected to stay stable "
            f"around {avg:.1f} units/day over the next {len(points)} days."
        )
