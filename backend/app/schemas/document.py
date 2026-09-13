# ==============================================================================
# Layer: Pydantic Schemas — Statutory Documents (app/schemas/document.py)
# ALLOWED:
#   - Define request/response validation schemas for official stage documents.
# NOT ALLOWED:
#   - Do NOT handle raw file streaming or disk I/O in schemas.
# ==============================================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CaseStage, DocumentType


class DocumentCreate(BaseModel):
    stage: CaseStage
    doc_type: DocumentType
    file_url: str = Field(..., max_length=500)
    title: Optional[str] = Field(None, max_length=255)
    filename: Optional[str] = Field(None, max_length=255)
    storage_key: Optional[str] = Field(None, max_length=500)
    mime_type: str = Field("application/pdf", max_length=100)
    document_type: Optional[str] = Field(None, max_length=100)
    file_size_bytes: Optional[int] = Field(0)


class DocumentRead(BaseModel):
    id: int
    case_id: int
    stage: str
    doc_type: str
    file_url: str
    title: Optional[str] = None
    filename: Optional[str] = None
    storage_key: Optional[str] = None
    mime_type: str = "application/pdf"
    document_type: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    uploaded_by_user_id: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
