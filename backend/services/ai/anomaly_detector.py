"""
Anomaly Detection — two-tier approach.

Tier 1 (rules): deterministic, always-on, zero training data required.
Directly implements the exact signals the problem statement calls out:
  - long idle hours relative to engine hours
  - unassigned equipment (no last_operator_id) still logging usage
  - overdue / stale check-outs (handled in RentalService, not here)

Tier 2 (ML): Isolation Forest over [engine_hours_day, idle_hours_day,
operating_days_cumulative] to catch multivariate outliers the fixed
thresholds would miss (e.g. unusual combinations that are each individually
"normal"). Falls back gracefully to rules-only when there isn't enough
history to fit a model (< 10 samples).

Output: one AnomalyResult per log row, with a confidence score and
plain reason codes — never a bare "anomaly: true/false".
"""
from datetime import date

import numpy as np
from sklearn.ensemble import IsolationForest

from config import settings
from models.usage_log import UsageLog
from schemas.anomaly import AnomalyResult


class AnomalyDetector:
    def __init__(self):
        self.idle_threshold = settings.idle_ratio_anomaly_threshold

    def _rule_based(self, log: UsageLog) -> tuple[list[str], float]:
        reasons: list[str] = []
        score = 0.0

        if log.idle_ratio >= self.idle_threshold and (log.engine_hours_day + log.idle_hours_day) > 0:
            reasons.append("high_idle_ratio")
            score += log.idle_ratio

        if log.last_operator_id is None and (log.engine_hours_day > 0 or log.idle_hours_day > 0):
            reasons.append("unassigned_operator_active_asset")
            score += 0.5

        if log.engine_hours_day == 0 and log.idle_hours_day == 0:
            reasons.append("zero_activity_logged")
            score += 0.2

        return reasons, score

    def detect(self, logs: list[UsageLog]) -> list[AnomalyResult]:
        if not logs:
            return []

        rule_results = [self._rule_based(log) for log in logs]

        # Fit Isolation Forest only when there's enough data to be meaningful.
        ml_scores = [0.0] * len(logs)
        if len(logs) >= 10:
            X = np.array(
                [[l.engine_hours_day, l.idle_hours_day, l.operating_days_cumulative] for l in logs]
            )
            model = IsolationForest(contamination="auto", random_state=42, n_estimators=100)
            model.fit(X)
            raw_scores = model.decision_function(X)  # lower = more anomalous
            # normalize to 0..1 where higher = more anomalous
            ml_scores = list(1 - (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-9))

        results = []
        for log, (reasons, rule_score), ml_score in zip(logs, rule_results, ml_scores):
            combined_score = round(0.6 * rule_score + 0.4 * ml_score, 3)
            if ml_score > 0.75 and "multivariate_outlier" not in reasons:
                reasons = reasons + ["multivariate_outlier"]

            results.append(
                AnomalyResult(
                    equipment_id=log.equipment_id,
                    log_date=log.log_date,
                    is_anomaly=combined_score >= 0.5 or len(reasons) > 0,
                    anomaly_score=combined_score,
                    reason_codes=reasons,
                    confidence=round(min(0.95, 0.5 + combined_score / 2), 3),
                )
            )
        return results

    def detect_single(self, log: UsageLog) -> AnomalyResult:
        """Convenience wrapper for real-time single-record checks (e.g. on usage log submit)."""
        return self.detect([log])[0]
