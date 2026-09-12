# ==============================================================================
# Layer: Pydantic Schemas — Audit Trail (app/schemas/audit.py)
# ALLOWED:
#   - Define serialization models for audit log entries and flag-for-review requests.
# NOT ALLOWED:
#   - Do NOT provide update schemas for actor_user_id, action, remarks, or created_at.
#   - Audit rows are immutable; only the flagged status is mutable via flag request.
# ==============================================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AuditLogRead(BaseModel):
    id: int
    case_id: int
    actor_user_id: int
    actor_name: Optional[str] = None
    action: str
    remarks: Optional[str] = None
    created_at: datetime
    flagged: bool
    flagged_by_user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogFlagRequest(BaseModel):
    remarks: Optional[str] = Field(None, description="Reason for flagging this audit entry for supervisory review.")
