from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from repositories.usage_repo import UsageRepository
from repositories.equipment_repo import EquipmentRepository
from repositories.checkevent_repo import CheckEventRepository
from services.ai.anomaly_detector import AnomalyDetector
from services.ai.recommendation_engine import RecommendationEngine
from schemas.anomaly import AnomalyResult, RecommendationOut

router = APIRouter(prefix="/anomalies", tags=["anomaly detection & recommendations"])


@router.get("/recent", response_model=list[AnomalyResult])
def get_recent_anomalies(days: int = 14, db: Session = Depends(get_db)):
    """Feeds the Anomaly Investigation screen."""
    logs = UsageRepository(db).all_recent(days=days)
    results = AnomalyDetector().detect(logs)
    return [r for r in results if r.is_anomaly]


@router.get("/recommendations/reallocate", response_model=list[RecommendationOut])
def get_reallocation_recommendations(db: Session = Depends(get_db)):
    eq_repo = EquipmentRepository(db)
    usage_repo = UsageRepository(db)

    equipment_list = eq_repo.list_all()
    usage_by_id = {
        eq.equipment_id: usage_repo.history_for_equipment(eq.equipment_id, days=14)
        for eq in equipment_list
    }
    return RecommendationEngine().reallocation_candidates(equipment_list, usage_by_id)


@router.get("/recommendations/next-best-asset", response_model=list[RecommendationOut])
def get_next_best_asset(equipment_type: str, site_id: str | None = None, db: Session = Depends(get_db)):
    eq_repo = EquipmentRepository(db)
    usage_repo = UsageRepository(db)

    candidates = eq_repo.list_all(type_=equipment_type)
    usage_by_id = {
        eq.equipment_id: usage_repo.history_for_equipment(eq.equipment_id, days=14)
        for eq in candidates
    }
    return RecommendationEngine().next_best_asset(equipment_type, site_id, candidates, usage_by_id)


@router.get("/recommendations/extensions", response_model=list[RecommendationOut])
def get_extension_nudges(db: Session = Depends(get_db)):
    check_repo = CheckEventRepository(db)
    usage_repo = UsageRepository(db)

    active_events = check_repo.list_active()
    usage_by_id = {
        ev.equipment_id: usage_repo.history_for_equipment(ev.equipment_id, days=14)
        for ev in active_events
    }
    return RecommendationEngine().extension_nudges(active_events, usage_by_id)
