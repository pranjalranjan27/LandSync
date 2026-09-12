# ==============================================================================
# Layer: Pydantic Schemas — LARR Authority Dispute Referrals (app/schemas/dispute_referral.py)
# ALLOWED:
#   - Define payload schemas for dispute referral creation, updates, and reads.
# NOT ALLOWED:
#   - NEVER evaluate workflow state machine logic or permissions inside schemas.
# ==============================================================================

import uuid
from datetime import datetime, date
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DisputeReferralStatus


class DisputeReferralCreate(BaseModel):
    """Payload submitted by Collector or State Approver to refer a case to LARR Authority."""
    reason: str = Field(..., min_length=5, description="Statutory grounds for compensation dispute under Section 64.")


class DisputeReferralUpdate(BaseModel):
    """Payload submitted by LARR Authority to update proceedings and resolution status."""
    status: Optional[DisputeReferralStatus] = None
    larr_case_number: Optional[str] = Field(None, max_length=100, description="Formal LARR Authority case reference number.")
    hearing_dates: Optional[List[str]] = Field(None, description="Chronological hearing dates scheduled or held.")
    outcome: Optional[str] = Field(None, description="Substantive decision / enhanced compensation order.")
    high_court_appeal_outcome: Optional[str] = Field(None, description="Appellate outcome if challenged before the High Court.")


class DisputeReferralRead(BaseModel):
    """Full serialized representation of a statutory dispute referral."""
    id: Union[uuid.UUID, str]
    case_id: int
    referred_at: datetime
    referred_by_user_id: int
    reason: str
    larr_case_number: Optional[str] = None
    hearing_dates: Optional[List[Union[str, date]]] = []
    status: str
    outcome: Optional[str] = None
    high_court_appeal_outcome: Optional[str] = None
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
