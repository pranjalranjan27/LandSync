# ==============================================================================
# Layer: Services Package (app/services/__init__.py)
# ALLOWED:
#   - Expose domain services, workflow state machine, and jurisdiction authorization.
# NOT ALLOWED:
#   - Never import from api/ routes.
#   - Services must never perform direct HTTP parsing.
# ==============================================================================

from app.services.stage_machine import ALLOWED_TRANSITIONS, validate_stage_transition
from app.services.jurisdiction import check_user_jurisdiction, enforce_jurisdiction
from app.services.auth_service import AuthService
from app.services.case_service import CaseService
from app.services.parcel_service import ParcelService
from app.services.workflow_service import WorkflowService
from app.services.analytics_service import AnalyticsService

__all__ = [
    "ALLOWED_TRANSITIONS",
    "validate_stage_transition",
    "check_user_jurisdiction",
    "enforce_jurisdiction",
    "AuthService",
    "CaseService",
    "ParcelService",
    "WorkflowService",
    "AnalyticsService",
]
