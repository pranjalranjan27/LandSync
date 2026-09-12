# ==============================================================================
# Layer: Services — Statutory Acquisition Risk Analysis (app/services/risk_service.py)
#
# STATUTORY DESIGN INTENT & COMPUTATION PRINCIPLES:
# The Risk Analysis module serves as an early-warning decision support system for the
# District Collector and State Approver under the RFCTLARR Act, 2013.
#
# DESIGN CONSTRAINTS:
# 1. Computed entirely ON READ (no background celery/cron tasks, ensuring real-time freshness).
# 2. Gated strictly to cases at 'sia_complete' or later stages; returns 409 Conflict if SIA data
#    does not yet exist.
# 3. Fully explainable: exposes each component weight (affected families, pending litigation,
#    cost density against NGDRS circle rates, and location sensitivity) rather than a black-box score.
# ==============================================================================

from datetime import datetime, timezone
from typing import Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.case import Case
from app.models.user import User
from app.models.enums import UserRole, LocationSensitivity, DisputeStatus
from app.models.village_circle_rate import VillageCircleRate
from app.repositories.case_repo import CaseRepository
from app.repositories.parcel_repo import ParcelRepository
from app.services.jurisdiction import enforce_jurisdiction
from app.schemas.risk import RiskAssessmentResponse, RiskComponentBreakdown

# Canonical stages representing SIA completion or later
SIA_COMPLETE_OR_LATER_STAGES: Set[str] = {
    "sia_complete",
    "notification_published",
    "objections_window",
    "award_declared",
    "compensation_disbursed",
    "possession_taken",
    "rr_in_progress",
    "completed",
}

DEFAULT_CIRCLE_RATE_PER_SQM = 3500.0  # Fallback benchmark for Gautam Buddha Nagar revenue villages
DEFAULT_PROJECT_BUDGET = 50_000_000.0  # ₹5 Crore baseline acquisition project allocation


class RiskService:
    """
    Statutory Land Acquisition Risk Analysis Service.
    Computes explainable composite risk scores on read from cadastral, SIA, valuation,
    and litigation registries.
    """

    @classmethod
    def compute_risk_assessment(
        cls,
        db: Session,
        case_id: int,
        user: User
    ) -> RiskAssessmentResponse:
        """
        Computes dynamic multi-factor risk assessment for a case at or beyond 'sia_complete'.
        Enforces ABAC territorial jurisdiction and role authorization.
        """
        # Role authorization: District Collector, State Approver, Policy Viewer
        allowed_roles = {
            UserRole.DISTRICT_COLLECTOR.value,
            UserRole.STATE_APPROVER.value,
            UserRole.POLICY_VIEWER.value,
        }
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Role '{user.role}' is not authorized to view risk assessment."
            )

        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Acquisition case #{case_id} not found."
            )

        # Enforce ABAC jurisdiction (Policy Viewer is global; Collector/Approver scoped)
        if user.role != UserRole.POLICY_VIEWER.value:
            enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        # Stage gate: Only meaningful once case has reached sia_complete or later
        curr_stage = (case.current_stage or "").lower()
        if curr_stage not in SIA_COMPLETE_OR_LATER_STAGES:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Risk assessment requires completed SIA data. Current stage is prior to 'sia_complete'."
            )

        # 1. Metric: Affected Families Count (from SIA verdict or case records)
        if case.sia_verdict and case.sia_verdict.independent_family_estimate is not None:
            affected_families_count = case.sia_verdict.independent_family_estimate
        elif case.affected_families:
            affected_families_count = len(case.affected_families)
        else:
            affected_families_count = case.estimated_affected_families or 0

        # Component 1: Affected Families Score (Max 30 pts)
        # Scaled non-linearly: 0-25 families = low risk; 26-100 = moderate; >100 = high displacement risk
        if affected_families_count <= 0:
            fam_score = 0.0
        elif affected_families_count <= 25:
            fam_score = (affected_families_count / 25.0) * 10.0
        elif affected_families_count <= 100:
            fam_score = 10.0 + ((affected_families_count - 25) / 75.0) * 12.0
        else:
            fam_score = min(30.0, 22.0 + ((affected_families_count - 100) / 200.0) * 8.0)

        # 2. Metric: Linked Parcels, Areas, and Dispute Flags
        linked_parcels = ParcelRepository.list_by_case(db, case_id)
        total_area_sqm = sum(p.area_sqm for p in linked_parcels) if linked_parcels else 0.0

        dispute_count = sum(
            1 for p in linked_parcels
            if (p.dispute_status or "").lower() == DisputeStatus.UNDER_LITIGATION.value
        )
        prohibited_count = sum(
            1 for p in linked_parcels
            if (p.dispute_status or "").lower() == DisputeStatus.PROHIBITED.value
        )

        # Component 2: Dispute Score (Max 35 pts)
        # Pending civil litigation in NJDG or prohibition flags in NGDRS directly threaten possession
        if prohibited_count > 0:
            dispute_score = 35.0  # Automatic maximum risk if prohibited parcel is involved
        elif dispute_count == 0:
            dispute_score = 0.0
        else:
            dispute_score = min(35.0, dispute_count * 12.0)

        # 3. Metric: Land Value Estimate from NGDRS Circle Rates & Project Budget
        land_value_estimate = 0.0
        for p in linked_parcels:
            # Query statutory village circle rate
            stmt = select(VillageCircleRate).where(
                func.lower(VillageCircleRate.village) == p.village.strip().lower(),
                func.lower(VillageCircleRate.district) == p.district.strip().lower()
            ).order_by(VillageCircleRate.effective_year.desc())
            circle_rate_obj = db.scalars(stmt).first()
            rate = circle_rate_obj.rate_per_sqm if circle_rate_obj else DEFAULT_CIRCLE_RATE_PER_SQM
            land_value_estimate += p.area_sqm * rate

        project_budget = DEFAULT_PROJECT_BUDGET

        # Component 3: Cost Density Score (Max 20 pts)
        # Ratio of land valuation estimate to project budget
        cost_ratio = land_value_estimate / project_budget if project_budget > 0 else 1.0
        if cost_ratio <= 0.5:
            cost_density_score = cost_ratio * 20.0
        else:
            cost_density_score = min(20.0, 10.0 + ((cost_ratio - 0.5) / 1.0) * 10.0)

        # 4. Metric: Location Sensitivity
        loc_sensitivity = (case.location_sensitivity or LocationSensitivity.STANDARD.value).lower()
        if loc_sensitivity == LocationSensitivity.NEAR_PROTECTED_AREA.value:
            loc_score = 15.0
        elif loc_sensitivity == LocationSensitivity.NEAR_FOREST.value:
            loc_score = 11.0
        elif loc_sensitivity == LocationSensitivity.DENSE_URBAN.value:
            loc_score = 7.0
        else:
            loc_score = 2.0  # STANDARD

        # Total Composite Risk Score (0 - 100)
        total_score = round(fam_score + dispute_score + cost_density_score + loc_score, 1)
        total_score = max(0.0, min(100.0, total_score))

        # Risk Band Categorization
        # 0 - 33: low
        # 34 - 66: medium
        # 67 - 100: high
        if total_score <= 33.0:
            risk_band = "low"
        elif total_score <= 66.0:
            risk_band = "medium"
        else:
            risk_band = "high"

        breakdown = RiskComponentBreakdown(
            affected_families_score=round(fam_score, 1),
            dispute_score=round(dispute_score, 1),
            cost_density_score=round(cost_density_score, 1),
            location_sensitivity_score=round(loc_score, 1),
            affected_families_count=affected_families_count,
            dispute_count=dispute_count,
            prohibited_count=prohibited_count,
            total_area_sqm=round(total_area_sqm, 2),
            land_value_estimate=round(land_value_estimate, 2),
            project_budget=round(project_budget, 2),
            location_sensitivity=loc_sensitivity
        )

        return RiskAssessmentResponse(
            case_id=case.id,
            risk_score=total_score,
            risk_band=risk_band,
            components=breakdown,
            computed_at=datetime.now(timezone.utc)
        )
