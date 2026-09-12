# ==============================================================================
# Layer: Domain Models Package (app/models/__init__.py)
# ALLOWED:
#   - Expose all SQLAlchemy 2.0 ORM models and domain enums for clean import access.
# NOT ALLOWED:
#   - Do not invoke database operations, define routes, or perform business checks here.
# ==============================================================================

from app.models.enums import (
    CaseStage,
    UserRole,
    JurisdictionLevel,
    ParcelStatus,
    EncroachmentStatus,
    OwnershipType,
    PurposeCategory,
    DocumentType,
    SIACostRating,
    SIARecommendation,
    RRStatus,
    DisputeStatus,
    LocationSensitivity,
    SignatureActionType,
    DisputeReferralStatus,
)
from app.models.user import State, District, User
from app.models.parcel import Parcel
from app.models.case import Case, case_parcels
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.village_circle_rate import VillageCircleRate
from app.models.document_signature import DocumentSignature
from app.models.dispute_referral import DisputeReferral
from app.models.workflow import (
    SIAVerdict,
    Objection,
    Award,
    RRScheme,
    AffectedFamily,
    FamilyStatusLog,
    StageDurationConfig,
)

__all__ = [
    "CaseStage",
    "UserRole",
    "JurisdictionLevel",
    "ParcelStatus",
    "EncroachmentStatus",
    "OwnershipType",
    "PurposeCategory",
    "DocumentType",
    "SIACostRating",
    "SIARecommendation",
    "RRStatus",
    "DisputeStatus",
    "LocationSensitivity",
    "SignatureActionType",
    "DisputeReferralStatus",
    "DisputeReferral",
    "State",
    "District",
    "User",
    "Parcel",
    "Case",
    "case_parcels",
    "AuditLog",
    "Document",
    "VillageCircleRate",
    "DocumentSignature",
    "SIAVerdict",
    "Objection",
    "Award",
    "RRScheme",
    "AffectedFamily",
    "FamilyStatusLog",
    "StageDurationConfig",
]
