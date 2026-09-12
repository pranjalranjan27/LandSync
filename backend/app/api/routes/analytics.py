# ==============================================================================
# Layer: API Routes — Platform Analytics & Dashboards (app/api/routes/analytics.py)
# ALLOWED:
#   - Expose executive dashboard endpoints, parse scope parameters, and invoke AnalyticsService.
# NOT ALLOWED:
#   - NEVER run SQL aggregation queries directly in this route.
#   - NO cross-jurisdiction data leakage.
# ==============================================================================

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Executive Analytics"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse, status_code=status.HTTP_200_OK)
def get_dashboard(
    scope: str = Query("national", description="Scope level: 'district', 'state', or 'national'"),
    id: Optional[int] = Query(None, description="District ID or State ID when scope is not national"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve aggregated platform metrics and stage distributions.
    Automatically bounds queries to the caller's ABAC jurisdiction.
    """
    return AnalyticsService.get_dashboard_analytics(
        db=db,
        user=current_user,
        scope=scope,
        scope_id=id
    )
