"""
Smart Recommendations — explainable weighted-scoring engine.

Deliberately rule/heuristic-based rather than a learned ranker: with a
small hackathon dataset there's no reliable historical-outcome signal to
train a ranking model on, and a transparent scoring formula is easier to
justify live to judges than a black-box model. Production roadmap swaps
this for a LightGBM/learning-to-rank model trained on real allocation
outcomes once enough data exists.

Three recommendation types:
  1. next_best_asset       — which available asset best fits a new job/site
  2. reallocate            — which underused assets should move sites
  3. extend_contract_nudge — assets nearing return that show heavy recent
                              usage (likely to be extended) get a proactive nudge
"""
from datetime import date, timedelta

from models.equipment import Equipment, EquipmentStatus
from models.usage_log import UsageLog
from models.check_event import CheckEvent
from schemas.anomaly import RecommendationOut


class RecommendationEngine:

    def next_best_asset(
        self, equipment_type: str, target_site_id: str | None, candidates: list[Equipment],
        recent_usage_by_id: dict[str, list[UsageLog]],
    ) -> list[RecommendationOut]:
        """Score available assets of the requested type for a new job."""
        scored: list[RecommendationOut] = []
        for eq in candidates:
            if eq.type != equipment_type or eq.status != EquipmentStatus.AVAILABLE:
                continue

            score = 0.0
            metadata = {}

            # Proximity: same site scores highest (no real geo-distance in this dataset)
            if target_site_id and eq.site_id == target_site_id:
                score += 0.5
                metadata["proximity"] = "same_site"
            else:
                score += 0.2
                metadata["proximity"] = "different_site"

            # Condition proxy: lower recent idle ratio + no recent anomalies = healthier asset
            logs = recent_usage_by_id.get(eq.equipment_id, [])
            if logs:
                avg_idle_ratio = sum(l.idle_ratio for l in logs) / len(logs)
                condition_score = 1 - avg_idle_ratio  # less idle history -> more "ready" / reliable
                score += 0.5 * condition_score
                metadata["avg_idle_ratio_recent"] = round(avg_idle_ratio, 3)
            else:
                score += 0.25  # neutral score, no history
                metadata["avg_idle_ratio_recent"] = None

            scored.append(
                RecommendationOut(
                    recommendation_type="next_best_asset",
                    equipment_id=eq.equipment_id,
                    message=f"{eq.equipment_id} ({eq.type}) is a strong match for this job.",
                    score=round(score, 3),
                    metadata=metadata,
                )
            )
        return sorted(scored, key=lambda r: r.score, reverse=True)

    def reallocation_candidates(
        self, equipment_list: list[Equipment], usage_by_id: dict[str, list[UsageLog]], min_idle_ratio: float = 0.6
    ) -> list[RecommendationOut]:
        """Flag rented-but-underused assets as reallocation candidates."""
        results = []
        for eq in equipment_list:
            logs = usage_by_id.get(eq.equipment_id, [])
            if not logs:
                continue
            avg_idle_ratio = sum(l.idle_ratio for l in logs) / len(logs)
            if avg_idle_ratio >= min_idle_ratio:
                results.append(
                    RecommendationOut(
                        recommendation_type="reallocate",
                        equipment_id=eq.equipment_id,
                        message=(
                            f"{eq.equipment_id} has averaged {avg_idle_ratio:.0%} idle time "
                            f"over its last {len(logs)} logged days — consider reallocating "
                            f"to a higher-demand site."
                        ),
                        score=round(avg_idle_ratio, 3),
                        metadata={"avg_idle_ratio": round(avg_idle_ratio, 3), "site_id": eq.site_id},
                    )
                )
        return sorted(results, key=lambda r: r.score, reverse=True)

    def extension_nudges(
        self, active_events: list[CheckEvent], usage_by_id: dict[str, list[UsageLog]],
        days_before_expected: int = 3,
    ) -> list[RecommendationOut]:
        """Proactively suggest contract extensions for heavily-used assets nearing return."""
        results = []
        today = date.today()
        for ev in active_events:
            if not ev.expected_return_date:
                continue
            days_left = (ev.expected_return_date - today).days
            if 0 <= days_left <= days_before_expected:
                logs = usage_by_id.get(ev.equipment_id, [])
                if not logs:
                    continue
                avg_engine_hours = sum(l.engine_hours_day for l in logs) / len(logs)
                if avg_engine_hours >= 4.0:  # heavy usage -> likely worth extending
                    results.append(
                        RecommendationOut(
                            recommendation_type="extend_contract_nudge",
                            equipment_id=ev.equipment_id,
                            message=(
                                f"{ev.equipment_id} is averaging {avg_engine_hours:.1f} engine "
                                f"hours/day and is due back in {days_left} day(s). "
                                f"Prompt the client with an extension offer."
                            ),
                            score=round(avg_engine_hours / 12, 3),
                            metadata={"days_left": days_left, "avg_engine_hours": round(avg_engine_hours, 2)},
                        )
                    )
        return sorted(results, key=lambda r: r.score, reverse=True)
