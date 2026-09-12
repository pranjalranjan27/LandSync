# ==============================================================================
# Layer: Pydantic Schemas — Digital Signatures (app/schemas/signature.py)
# ALLOWED:
#   - Define payload and response schemas for tamper-evident digital signatures.
#   - Enforce that signer identity MUST NOT be accepted from the client request body.
#     Identity is always extracted server-side from current_user auth context.
# ==============================================================================

import uuid
from datetime import datetime
from typing import Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SignatureActionType


class SignatureRequest(BaseModel):
    """
    Client request payload for initiating a digital signature on a statutory decision.
    NOTE: Signer user ID, name, role, and jurisdiction are strictly derived server-side
    from authenticated session context to prevent identity spoofing.
    """
    document_id: Optional[int] = Field(
        None,
        description="ID of the uploaded statutory decision document to bind this signature to"
    )
    action_type: SignatureActionType = Field(
        ...,
        description="High-stakes statutory action type: 'notification_published', 'award_declared', or 'rejected'"
    )


class SignatureResponse(BaseModel):
    """
    Complete cryptographic signature record returned to the client and embedded
    in statutory decision certificates.
    """
    id: Union[uuid.UUID, str]
    case_id: int
    document_id: Optional[int] = None
    signer_user_id: int
    signer_name: Optional[str] = None
    signer_role: str
    signer_jurisdiction: str
    action_type: str
    payload_hash: str = Field(..., description="Server-side SHA-256 tamper-evident payload hash")
    signed_at: datetime

    model_config = ConfigDict(from_attributes=True)
