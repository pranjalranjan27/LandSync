# ==============================================================================
# Layer: Domain Enums & Constants (app/models/enums.py)
# ALLOWED:
#   - Define the single source of truth for all domain enums (workflow stages, roles,
#     jurisdiction levels, categories, statuses).
#   - Use Python's standard enum.Enum (inheriting from str, Enum) for JSON serializability.
# NOT ALLOWED:
#   - Do not import database sessions or repository methods here.
#   - Do not implement permission checks or route handlers in this file.
# ==============================================================================

from enum import Enum


class CaseStage(str, Enum):
    """
    The canonical 13-stage workflow progression for LandSync.
    Single source of truth for the entire platform.
    """
    PROPOSAL_SUBMITTED = "proposal_submitted"
    DISTRICT_REVIEW = "district_review"
    STATE_REVIEW = "state_review"
    SIA_IN_PROGRESS = "sia_in_progress"
    NOTIFICATION_PUBLISHED = "notification_published"
    OBJECTIONS_WINDOW = "objections_window"
    AWARD_DECLARED = "award_declared"
    COMPENSATION_DISBURSED = "compensation_disbursed"
    POSSESSION_TAKEN = "possession_taken"
    RR_IN_PROGRESS = "rr_in_progress"
    COMPLETED = "completed"

    # Terminal / clarification states
    RETURNED_FOR_CLARIFICATION = "returned_for_clarification"
    REJECTED = "rejected"


class UserRole(str, Enum):
    """Platform roles for Role-Based Access Control (RBAC)."""
    REQUIRING_BODY = "requiring_body"
    DISTRICT_COLLECTOR = "district_collector"
    STATE_APPROVER = "state_approver"
    SIA_EXPERT = "sia_expert"
    RR_ADMINISTRATOR = "rr_administrator"
    FIELD_OFFICER = "field_officer"
    POLICY_VIEWER = "policy_viewer"


class JurisdictionLevel(str, Enum):
    """Attribute-Based Access Control (ABAC) jurisdiction scope."""
    DISTRICT = "district"
    STATE = "state"
    NATIONAL = "national"


class ParcelStatus(str, Enum):
    """Lifecycle status of a cadastral parcel."""
    NOT_STARTED = "not_started"
    UNDER_PROCESS = "under_process"
    ACQUIRED = "acquired"
    DISPUTED = "disputed"


class PurposeCategory(str, Enum):
    """Statutory purpose categories for land acquisition proposals."""
    INFRASTRUCTURE = "infrastructure"
    IRRIGATION = "irrigation"
    INDUSTRIAL_CORRIDOR = "industrial_corridor"
    URBAN_DEVELOPMENT = "urban_development"
    HIGHWAYS = "highways"
    RAILWAYS = "railways"
    METRO = "metro"
    POWER = "power"
    OTHER = "other"


class DocumentType(str, Enum):
    """Types of official evidentiary documents attached to acquisition stages."""
    NOTIFICATION = "notification"
    SIA_REPORT = "sia_report"
    HEARING_MINUTES = "hearing_minutes"
    AWARD = "award"
    RR_SCHEME = "rr_scheme"
    DEVELOPMENT_PLAN = "development_plan"
    COMPENSATION_RECEIPT = "compensation_receipt"
    RELOCATION_CONFIRMATION = "relocation_confirmation"
    OTHER = "other"


class SIACostRating(str, Enum):
    """SIA assessment of economic/social cost impact."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class SIARecommendation(str, Enum):
    """Final expert recommendation on the acquisition proposal."""
    PROCEED = "proceed"
    PROCEED_WITH_MODIFICATIONS = "proceed_with_modifications"
    DO_NOT_PROCEED = "do_not_proceed"


class RRStatus(str, Enum):
    """Rehabilitation and Resettlement milestone status for affected families."""
    SCHEME_COMMUNICATED = "scheme_communicated"
    COMPENSATION_PROCESSED = "compensation_processed"
    RELOCATED = "relocated"
    RESETTLEMENT_VERIFIED = "resettlement_verified"
