# ==============================================================================
# Layer: Pydantic Schemas — Statutory Documents (app/schemas/document.py)
# ALLOWED:
#   - Define request/response validation schemas for official stage documents.
# NOT ALLOWED:
#   - Do NOT handle raw file streaming or disk I/O in schemas.
# ==============================================================================

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CaseStage, DocumentType


class DocumentCreate(BaseModel):
    stage: CaseStage
    doc_type: DocumentType
    file_url: str = Field(..., max_length=500)


class DocumentRead(BaseModel):
    id: int
    case_id: int
    stage: CaseStage
    doc_type: DocumentType
    file_url: str
    uploaded_by_user_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
