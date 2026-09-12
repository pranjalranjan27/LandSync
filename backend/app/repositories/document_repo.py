# ==============================================================================
# Layer: Repositories — Statutory Documents (app/repositories/document_repo.py)
# ALLOWED:
#   - Execute raw database queries for document metadata associated with case stages.
# NOT ALLOWED:
#   - NO filesystem I/O, NO file uploads or streaming operations here.
#   - NEVER evaluate business rules or stage validity here.
# ==============================================================================

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.document import Document


class DocumentRepository:
    """Raw database access queries for Statutory Documents."""

    @staticmethod
    def create_document(db: Session, doc_data: dict) -> Document:
        doc = Document(
            case_id=doc_data["case_id"],
            stage=doc_data["stage"],
            doc_type=doc_data["doc_type"],
            file_url=doc_data["file_url"],
            uploaded_by_user_id=doc_data["uploaded_by_user_id"],
            uploaded_at=datetime.now(timezone.utc)
        )
        db.add(doc)
        db.flush()
        return doc

    @staticmethod
    def get_document_by_id(db: Session, document_id: int) -> Optional[Document]:
        return db.get(Document, document_id)

    @staticmethod
    def get_documents_by_case(
        db: Session,
        case_id: int,
        stage: Optional[str] = None
    ) -> List[Document]:
        stmt = select(Document).where(Document.case_id == case_id)
        if stage:
            stmt = stmt.where(Document.stage == stage)
        stmt = stmt.order_by(Document.uploaded_at.desc())
        return list(db.scalars(stmt).all())
