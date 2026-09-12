# ==============================================================================
# Layer: Pydantic Schemas — Analytics & Aggregated Dashboards (app/schemas/analytics.py)
# ALLOWED:
#   - Define response structures for executive dashboards filtered by scope (district/state/national).
#   - Encapsulate aggregate counts, overdue counts, total acquired land, and stage distributions.
# NOT ALLOWED:
#   - Do NOT run database aggregation queries in this file.
# ==============================================================================

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class StageDistribution(BaseModel):
    stage: str
    count: int


class DashboardAnalyticsResponse(BaseModel):
    scope: str = Field(..., description="Scope level: 'district', 'state', or 'national'")
    scope_id: Optional[int] = Field(None, description="District ID or State ID when scope is not national")
    total_cases: int
    active_cases: int
    completed_cases: int
    overdue_cases: int
    total_parcels: int
    total_land_hectares: float
    total_compensation_amount: float
    total_affected_families: int
    stage_breakdown: List[StageDistribution]
    recent_activities: List[Dict[str, Any]] = []
