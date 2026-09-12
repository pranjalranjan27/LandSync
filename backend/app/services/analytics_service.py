# ==============================================================================
# Layer: Services — Dashboard Analytics (app/services/analytics_service.py)
# ALLOWED:
#   - Aggregate high-level platform KPIs (case volumes, active vs completed, overdue breaches,
#     total land acquired, compensation disbursed, and stage distributions) scoped by jurisdiction.
#   - Enforce ABAC boundaries so local officers cannot inspect unpermitted jurisdictions.
# NOT ALLOWED:
#   - NO raw SQL generation outside of repositories.
# ==============================================================================

from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import CaseStage, JurisdictionLevel
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsResponse, StageDistribution
from app.repositories.case_repo import CaseRepository
from app.repositories.audit_repo import AuditRepository
from app.services.case_service import CaseService


class AnalyticsService:
    """Aggregates executive dashboard metrics across district, state, or national scopes."""

    @classmethod
    def get_dashboard_analytics(
        cls,
        db: Session,
        user: User,
        scope: str,
        scope_id: Optional[int] = None
    ) -> DashboardAnalyticsResponse:
        """
        Calculates platform performance metrics filtered by scope and bounded by user jurisdiction.
        """
        # Enforce ABAC scope restriction
        if user.jurisdiction_level == JurisdictionLevel.DISTRICT.value:
            scope = "district"
            scope_id = user.jurisdiction_id
        elif user.jurisdiction_level == JurisdictionLevel.STATE.value:
            if scope == "national":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="State-level users cannot query national scope analytics."
                )
            if scope == "state":
                scope_id = user.jurisdiction_id

        district_id = scope_id if scope == "district" else None
        state_id = scope_id if scope == "state" else None

        cases = CaseRepository.get_cases(
            db=db,
            district_id=district_id,
            state_id=state_id
        )

        total_cases = len(cases)
        active_cases = 0
        completed_cases = 0
        overdue_cases = 0
        total_parcels = 0
        total_hectares = 0.0
        total_compensation = 0.0
        total_families = 0
        stage_counts: dict[str, int] = {}

        for c in cases:
            # Stage tally
            stage_counts[c.current_stage] = stage_counts.get(c.current_stage, 0) + 1

            if c.current_stage == CaseStage.COMPLETED.value:
                completed_cases += 1
            elif c.current_stage != CaseStage.REJECTED.value:
                active_cases += 1

            # Check overdue status
            is_overdue, _ = CaseService._compute_sla(db, c)
            if is_overdue:
                overdue_cases += 1

            # Parcels & Area
            total_parcels += len(c.parcels)
            for p in c.parcels:
                total_hectares += float(p.area_hectares)

            # Compensation
            if c.award:
                total_compensation += float(c.award.compensation_amount)

            # Families
            total_families += c.estimated_affected_families

        stage_breakdown = [
            StageDistribution(stage=stage, count=count)
            for stage, count in sorted(stage_counts.items())
        ]

        # Recent activities (sample latest audit entries across these cases)
        recent_activities = []
        for c in cases[:5]:
            logs = AuditRepository.get_audit_logs_for_case(db, c.id)
            for log in logs[:2]:
                recent_activities.append({
                    "case_id": c.id,
                    "project_name": c.project_name,
                    "action": log.action,
                    "actor_name": log.actor.name if log.actor else "System",
                    "timestamp": log.created_at.isoformat(),
                    "remarks": log.remarks
                })

        return DashboardAnalyticsResponse(
            scope=scope,
            scope_id=scope_id,
            total_cases=total_cases,
            active_cases=active_cases,
            completed_cases=completed_cases,
            overdue_cases=overdue_cases,
            total_parcels=total_parcels,
            total_land_hectares=round(total_hectares, 4),
            total_compensation_amount=round(total_compensation, 2),
            total_affected_families=total_families,
            stage_breakdown=stage_breakdown,
            recent_activities=recent_activities
        )
