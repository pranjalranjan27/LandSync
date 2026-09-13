# ==============================================================================
# Layer: API Routes — Statutory Documents & Evidence (app/api/routes/documents.py)
# ALLOWED:
#   - Provide secure download and inline preview endpoints for case documents.
#   - Strictly enforce parent case RBAC + ABAC jurisdiction checks on every request.
#   - Utilize StorageService for disk retrieval, never raw file path manipulation.
# NOT ALLOWED:
#   - NO direct unauthenticated downloads or ID enumeration bypasses.
#   - Do not attempt unstable docx/xlsx to PDF conversion; return HTTP 415 instead.
# ==============================================================================

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentRead
from app.repositories.document_repo import DocumentRepository
from app.repositories.case_repo import CaseRepository
from app.services.jurisdiction import enforce_jurisdiction
from app.core.storage_service import StorageService

router = APIRouter(tags=["Statutory Documents & Evidence"])


def _verify_document_access(db: Session, document_id: int, user: User) -> Document:
    """
    Validates document existence and caller's jurisdiction over the parent case.
    Raises HTTP 404 if document or case not found, HTTP 403 if jurisdiction check fails.
    """
    doc = DocumentRepository.get_document_by_id(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Statutory document #{document_id} not found."
        )

    case = CaseRepository.get_case_by_id(db, doc.case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent case #{doc.case_id} associated with document #{document_id} not found."
        )

    # Enforce exact role + jurisdiction access matching the case detail view
    enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
    return doc


@router.get(
    "/{document_id}",
    response_model=DocumentRead,
    summary="Get document statutory metadata"
)
def get_document_metadata(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves document record metadata after enforcing parent case jurisdiction."""
    doc = _verify_document_access(db, document_id, current_user)
    return doc


@router.get(
    "/{document_id}/download",
    summary="Download binary document with attachment disposition"
)
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Streams file bytes with attachment Content-Disposition.
    Enforces authorization against the parent case.
    """
    doc = _verify_document_access(db, document_id, current_user)

    if not doc.storage_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document #{document_id} has no storage key configured."
        )

    try:
        file_bytes = StorageService.get_bytes(doc.storage_key)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Binary content for document #{document_id} is missing from storage."
        )

    filename = doc.filename or f"document_{doc.id}.pdf"
    mime_type = doc.mime_type or "application/octet-stream"

    return Response(
        content=file_bytes,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get(
    "/{document_id}/preview",
    summary="Preview document inline (PDF / images) or return 415 unsupported"
)
def preview_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Streams file bytes with inline Content-Disposition for browser rendering (PDF & images).
    Returns HTTP 415 for non-renderable file types (.docx, .xlsx), prompting client to download.
    """
    doc = _verify_document_access(db, document_id, current_user)

    mime_type = (doc.mime_type or "").lower().strip()
    is_pdf = mime_type == "application/pdf"
    is_image = mime_type.startswith("image/")

    if not (is_pdf or is_image):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Inline preview not available for this file type — please download to view"
        )

    if not doc.storage_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document #{document_id} has no storage key configured."
        )

    try:
        file_bytes = StorageService.get_bytes(doc.storage_key)
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Binary content for document #{document_id} is missing from storage."
        )

    filename = doc.filename or f"document_{doc.id}.pdf"

    return Response(
        content=file_bytes,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
