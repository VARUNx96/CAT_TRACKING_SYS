"""
AI Anomaly detection & Smart Recommendation endpoints.
Exclusively powered by AWS DynamoDB.
"""
from fastapi import APIRouter, Depends

from db.session import get_db
from repositories.dynamo_repository import DynamoRepository
from services.ai.anomaly_detector import AnomalyDetector
from services.ai.recommendation_engine import RecommendationEngine
from schemas.anomaly import AnomalyResult, RecommendationOut
from models.equipment import Equipment, EquipmentStatus
from models.check_event import CheckEvent
from models.usage_log import UsageLog

router = APIRouter(prefix="/anomalies", tags=["anomaly detection & recommendations"])


@router.get("/recent", response_model=list[AnomalyResult])
def get_recent_anomalies(days: int = 14, db: DynamoRepository = Depends(get_db)):
    """Feeds the Anomaly Investigation screen."""
    raw_logs = db.all_recent_usage(days=days)
    log_objs = [
        UsageLog(
            id=l["id"],
            equipment_id=l["equipment_id"],
            log_date=l["log_date"],
            engine_hours_day=l["engine_hours_day"],
            idle_hours_day=l["idle_hours_day"],
            operating_days_cumulative=l["operating_days_cumulative"],
            last_operator_id=l["last_operator_id"],
        )
        for l in raw_logs
    ]
    results = AnomalyDetector().detect(log_objs)
    return [r for r in results if r.is_anomaly]


@router.get("/recommendations/reallocate", response_model=list[RecommendationOut])
def get_reallocation_recommendations(db: DynamoRepository = Depends(get_db)):
    raw_eq = db.list_all_equipment()
    equipment_list = [
        Equipment(
            equipment_id=e["equipment_id"],
            type=e["type"],
            site_id=e["site_id"],
            status=EquipmentStatus(e["status"]) if e.get("status") in [s.value for s in EquipmentStatus] else EquipmentStatus.AVAILABLE,
            name=e.get("name"),
            model=e.get("model"),
            serial_number=e.get("serial_number"),
            client_name=e.get("client_name"),
        )
        for e in raw_eq
    ]
    usage_by_id = {
        eq.equipment_id: [
            UsageLog(
                id=l["id"],
                equipment_id=l["equipment_id"],
                log_date=l["log_date"],
                engine_hours_day=l["engine_hours_day"],
                idle_hours_day=l["idle_hours_day"],
                operating_days_cumulative=l["operating_days_cumulative"],
                last_operator_id=l["last_operator_id"],
            )
            for l in db.history_for_equipment(eq.equipment_id, days=14)
        ]
        for eq in equipment_list
    }
    return RecommendationEngine().reallocation_candidates(equipment_list, usage_by_id)


@router.get("/recommendations/next-best-asset", response_model=list[RecommendationOut])
def get_next_best_asset(equipment_type: str, site_id: str | None = None, db: DynamoRepository = Depends(get_db)):
    raw_eq = db.list_all_equipment(type_=equipment_type)
    candidates = [
        Equipment(
            equipment_id=e["equipment_id"],
            type=e["type"],
            site_id=e["site_id"],
            status=EquipmentStatus(e["status"]) if e.get("status") in [s.value for s in EquipmentStatus] else EquipmentStatus.AVAILABLE,
            name=e.get("name"),
            model=e.get("model"),
            serial_number=e.get("serial_number"),
            client_name=e.get("client_name"),
        )
        for e in raw_eq
    ]
    usage_by_id = {
        eq.equipment_id: [
            UsageLog(
                id=l["id"],
                equipment_id=l["equipment_id"],
                log_date=l["log_date"],
                engine_hours_day=l["engine_hours_day"],
                idle_hours_day=l["idle_hours_day"],
                operating_days_cumulative=l["operating_days_cumulative"],
                last_operator_id=l["last_operator_id"],
            )
            for l in db.history_for_equipment(eq.equipment_id, days=14)
        ]
        for eq in candidates
    }
    return RecommendationEngine().next_best_asset(equipment_type, site_id, candidates, usage_by_id)


@router.get("/recommendations/extensions", response_model=list[RecommendationOut])
def get_extension_nudges(db: DynamoRepository = Depends(get_db)):
    active_eq = [e for e in db.list_all_equipment() if e.get("status") == "Rented"]
    active_events = [
        CheckEvent(
            id=hash(f"{e['equipment_id']}-{e['check_out_date']}"),
            equipment_id=e["equipment_id"],
            check_out_date=e["check_out_date"],
            site_id=e.get("site_id"),
            expected_return_date=e.get("expected_return_date"),
            check_in_date=None,
        )
        for e in active_eq
    ]
    usage_by_id = {
        ev.equipment_id: [
            UsageLog(
                id=l["id"],
                equipment_id=l["equipment_id"],
                log_date=l["log_date"],
                engine_hours_day=l["engine_hours_day"],
                idle_hours_day=l["idle_hours_day"],
                operating_days_cumulative=l["operating_days_cumulative"],
                last_operator_id=l["last_operator_id"],
            )
            for l in db.history_for_equipment(ev.equipment_id, days=14)
        ]
        for ev in active_events
    }
    return RecommendationEngine().extension_nudges(active_events, usage_by_id)
