# ==============================================================================
# Layer: Pydantic Schemas — Risk Analysis Module (app/schemas/risk.py)
# ALLOWED:
#   - Define response and component breakdown schemas for explainable risk assessment.
#   - Represent individual scored factors: affected families, litigation/disputes,
#     cost density (circle rate valuation vs. budget), and location sensitivity.
# NOT ALLOWED:
#   - NO calculation logic in schemas (belongs in services/risk_service.py).
# ==============================================================================

from datetime import datetime
from pydantic import BaseModel, Field


class RiskComponentBreakdown(BaseModel):
    """
    Explainable breakdown of individual risk score components.
    Provides transparent justification for the District Collector and State Approver.
    """
    affected_families_score: float = Field(
        ..., ge=0, le=30, description="Risk contribution from number of displaced/affected families (max 30 pts)"
    )
    dispute_score: float = Field(
        ..., ge=0, le=35, description="Risk contribution from pending civil litigation & title disputes (max 35 pts)"
    )
    cost_density_score: float = Field(
        ..., ge=0, le=20, description="Risk contribution from land valuation density vs. project budget (max 20 pts)"
    )
    location_sensitivity_score: float = Field(
        ..., ge=0, le=15, description="Risk contribution from environmental/urban density sensitivity (max 15 pts)"
    )

    # Raw metrics for transparency and inspection
    affected_families_count: int = Field(..., ge=0)
    dispute_count: int = Field(..., ge=0, description="Number of parcels under litigation")
    prohibited_count: int = Field(..., ge=0, description="Number of prohibited parcels")
    total_area_sqm: float = Field(..., ge=0)
    land_value_estimate: float = Field(..., ge=0, description="Estimated land valuation (INR) derived from circle rates")
    project_budget: float = Field(..., ge=0, description="Project budget allocation (INR)")
    location_sensitivity: str = Field(...)


class RiskAssessmentResponse(BaseModel):
    """
    Dynamic on-read statutory risk assessment response.
    Available once a case reaches 'sia_complete' or later stages.
    """
    case_id: int
    risk_score: float = Field(..., ge=0, le=100, description="Composite risk index between 0 and 100")
    risk_band: str = Field(..., description="Categorical risk level: 'low' (0-33), 'medium' (34-66), or 'high' (67-100)")
    components: RiskComponentBreakdown
    computed_at: datetime = Field(..., description="Timestamp reflecting when this evaluation was calculated on read")
