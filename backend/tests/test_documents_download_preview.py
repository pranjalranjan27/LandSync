import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.case import Case


def test_download_and_preview_pdf_document(client: TestClient, db_session: Session, token_collector_gbnagar: str):
    """District Collector downloads and previews a statutory PDF document attached to their district case."""
    # Find a PDF document for case in District GB Nagar (district_id=1)
    doc = (
        db_session.query(Document)
        .join(Case, Document.case_id == Case.id)
        .filter(Case.district_id == 1, Document.mime_type == "application/pdf")
        .first()
    )
    assert doc is not None, "Seeded PDF document for GB Nagar case must exist."

    # Test Download
    res_dl = client.get(
        f"/api/v1/documents/{doc.id}/download",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res_dl.status_code == 200
    assert "application/pdf" in res_dl.headers["content-type"]
    assert "attachment; filename=" in res_dl.headers["content-disposition"]
    assert res_dl.content.startswith(b"%PDF")

    # Test Preview (inline disposition)
    res_prev = client.get(
        f"/api/v1/documents/{doc.id}/preview",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res_prev.status_code == 200
    assert "application/pdf" in res_prev.headers["content-type"]
    assert "inline; filename=" in res_prev.headers["content-disposition"]
    assert res_prev.content.startswith(b"%PDF")


def test_preview_xlsx_returns_415_unsupported_media_type(
    client: TestClient, db_session: Session, token_collector_gbnagar: str
):
    """
    Attempting inline preview on an XLSX document must return HTTP 415 Unsupported Media Type
    with an honest message instructing the user to download.
    """
    # Find seeded XLSX document
    doc = (
        db_session.query(Document)
        .filter(Document.mime_type.like("%spreadsheetml%"))
        .first()
    )
    assert doc is not None, "Seeded XLSX document must exist."

    res_prev = client.get(
        f"/api/v1/documents/{doc.id}/preview",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res_prev.status_code == 415
    assert "Inline preview not available for this file type — please download to view" in res_prev.json()["detail"]

    # However, download must succeed for this document
    res_dl = client.get(
        f"/api/v1/documents/{doc.id}/download",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res_dl.status_code == 200
    assert "attachment; filename=" in res_dl.headers["content-disposition"]
    assert res_dl.content[:2] == b"PK"


def test_document_cross_district_authorization_blocked(
    client: TestClient, db_session: Session, token_collector_agra: str
):
    """
    Collector for Agra (District 2) attempting to access a document belonging to
    a case in GB Nagar (District 1) must be rejected with HTTP 403 Forbidden.
    """
    gb_nagar_doc = (
        db_session.query(Document)
        .join(Case, Document.case_id == Case.id)
        .filter(Case.district_id == 1)
        .first()
    )
    assert gb_nagar_doc is not None

    # Agra Collector tries to download GB Nagar document
    res_dl = client.get(
        f"/api/v1/documents/{gb_nagar_doc.id}/download",
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert res_dl.status_code == 403
    assert "lacks authority over" in res_dl.json()["detail"]

    # Agra Collector tries to preview GB Nagar document
    res_prev = client.get(
        f"/api/v1/documents/{gb_nagar_doc.id}/preview",
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert res_prev.status_code == 403


def test_nonexistent_document_returns_404(client: TestClient, token_collector_gbnagar: str):
    """Accessing non-existent document ID returns HTTP 404."""
    res = client.get(
        "/api/v1/documents/999999/download",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 404
