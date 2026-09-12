# ==============================================================================
# Layer: Pydantic Schemas — Workflow Cases & Actions (app/schemas/case.py)
# ALLOWED:
#   - Define payload schemas for case creation, listing, detailed views, and stage actions.
#   - Encapsulate SLA metrics (is_overdue, days_in_stage) calculated at query time.
# NOT ALLOWED:
#   - NEVER execute transition validation logic inside schemas (belongs in services/stage_machine.py).
# ==============================================================================

from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CaseStage, PurposeCategory, LocationSensitivity
from app.schemas.parcel import ParcelRead
from app.schemas.signature import SignatureResponse
from app.schemas.dispute_referral import DisputeReferralRead


class CaseBase(BaseModel):
    project_name: str = Field(..., min_length=3, max_length=255)
    purpose_category: PurposeCategory
    justification: str = Field(..., min_length=10)
    estimated_affected_families: int = Field(default=0, ge=0)
    has_dispute_warning: bool = False
    location_sensitivity: LocationSensitivity = LocationSensitivity.STANDARD
    district_id: int
    state_id: int


class CaseCreate(CaseBase):
    parcel_ids: List[Union[int, str]] = Field(..., min_length=1)


class CaseRead(CaseBase):
    id: int
    requiring_body_user_id: int
    current_stage: CaseStage
    stage_entered_at: datetime
    created_at: datetime

    # Computed statutory SLA fields
    is_overdue: bool = False
    days_in_stage: int = 0

    # Parallel track LARR dispute referral flags
    has_active_dispute: bool = False
    active_dispute: Optional[DisputeReferralRead] = None

    model_config = ConfigDict(from_attributes=True)


class CaseDetail(CaseRead):
    parcels: List[ParcelRead] = []
    signatures: List[SignatureResponse] = []
    dispute_referrals: List[DisputeReferralRead] = []
    total_area_hectares: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# Action Request Schemas for /actions/* endpoints
class CaseActionRequest(BaseModel):
    remarks: Optional[str] = None


class CaseClarificationRequest(BaseModel):
    remarks: str = Field(..., min_length=5, description="Specific clarification requested from requiring body.")


class CaseRejectRequest(BaseModel):
    remarks: str = Field(..., min_length=5, description="Statutory justification for proposal rejection.")
    evidence_document_id: Optional[int] = Field(None, description="Optional uploaded rejection order document")
    document_id: Optional[int] = Field(None, description="Alias for evidence_document_id")


class NotificationPublishRequest(BaseModel):
    notification_number: Optional[str] = None
    document_id: Optional[int] = None
    evidence_document_id: Optional[int] = None
    remarks: Optional[str] = None
