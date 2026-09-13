import pytest
from fastapi.testclient import TestClient

from app.core.export_utils import generate_csv, generate_excel, generate_docx_table


def test_export_utils_generators():
    """Unit test for pure export generator functions."""
    sample_rows = [
        {"id": 1, "project": "Test Project 1", "budget": 100000, "status": "approved"},
        {"id": 2, "project": "Test Project 2", "budget": 250000, "status": "pending"},
    ]

    # CSV
    csv_bytes, csv_mime = generate_csv(sample_rows)
    assert len(csv_bytes) > 0
    assert "text/csv" in csv_mime
    assert b"Test Project 1" in csv_bytes

    # Excel
    xlsx_bytes, xlsx_mime = generate_excel(sample_rows, sheet_title="TestSheet")
    assert len(xlsx_bytes) > 0
    assert "spreadsheetml" in xlsx_mime
    assert xlsx_bytes[:2] == b"PK"  # Zip archive header for xlsx

    # Docx
    docx_bytes, docx_mime = generate_docx_table(sample_rows, title="Test Report")
    assert len(docx_bytes) > 0
    assert "wordprocessingml" in docx_mime
    assert docx_bytes[:2] == b"PK"  # Zip archive header for docx


def test_export_cases_endpoint_csv(client: TestClient, token_collector_gbnagar: str):
    """District Collector exports cases in CSV format."""
    res = client.get(
        "/api/v1/export/cases?format=csv",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment; filename=" in res.headers["content-disposition"]
    assert res.headers["content-disposition"].endswith('.csv"')
    assert len(res.content) > 0


def test_export_cases_endpoint_xlsx(client: TestClient, token_collector_gbnagar: str):
    """District Collector exports cases in Excel format."""
    res = client.get(
        "/api/v1/export/cases?format=xlsx",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 200
    assert "openxmlformats-officedocument.spreadsheetml.sheet" in res.headers["content-type"]
    assert res.headers["content-disposition"].endswith('.xlsx"')
    assert res.content[:2] == b"PK"


def test_export_cases_endpoint_docx(client: TestClient, token_collector_gbnagar: str):
    """District Collector exports cases in Word format."""
    res = client.get(
        "/api/v1/export/cases?format=docx",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 200
    assert "openxmlformats-officedocument.wordprocessingml.document" in res.headers["content-type"]
    assert res.headers["content-disposition"].endswith('.docx"')
    assert res.content[:2] == b"PK"


def test_export_parcels_endpoint(client: TestClient, token_collector_gbnagar: str):
    """District Collector exports cadastral parcels in Excel format."""
    res = client.get(
        "/api/v1/export/parcels?format=xlsx",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 200
    assert "openxmlformats-officedocument.spreadsheetml.sheet" in res.headers["content-type"]
    assert res.content[:2] == b"PK"


def test_export_audit_log_endpoint(client: TestClient, token_collector_gbnagar: str):
    """District Collector exports audit trail in CSV format."""
    res = client.get(
        "/api/v1/export/audit-log?format=csv",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]


def test_export_unsupported_resource_returns_400(client: TestClient, token_collector_gbnagar: str):
    """Requesting an unknown resource returns HTTP 400."""
    res = client.get(
        "/api/v1/export/unknown_resource?format=csv",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 400
    assert "not supported" in res.json()["detail"]


def test_export_unsupported_format_returns_400(client: TestClient, token_collector_gbnagar: str):
    """Requesting an unknown format returns HTTP 400."""
    res = client.get(
        "/api/v1/export/cases?format=pdf",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 400
    assert "Unsupported export format" in res.json()["detail"]
