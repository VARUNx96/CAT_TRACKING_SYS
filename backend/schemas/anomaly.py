from datetime import date

from pydantic import BaseModel


class AnomalyResult(BaseModel):
    equipment_id: str
    log_date: date
    is_anomaly: bool
    anomaly_score: float          # higher = more anomalous
    reason_codes: list[str]       # e.g. ["high_idle_ratio", "unassigned_operator"]
    confidence: float


class RecommendationOut(BaseModel):
    recommendation_type: str      # "reallocate" | "next_best_asset" | "extend_contract" | "maintenance"
    equipment_id: str
    message: str
    score: float
    metadata: dict = {}
