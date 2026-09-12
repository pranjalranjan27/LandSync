import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.parcel import Parcel
from app.models.case import Case
from app.models.audit import AuditLog
from app.models.enums import EncroachmentStatus, CaseStage, PurposeCategory


@pytest.fixture
def gb_nagar_case_for_parcels(db_session: Session, test_setup) -> Case:
    """Ensure at least one case exists in GB Nagar."""
    c = db_session.query(Case).filter_by(district_id=test_setup["gb_nagar_id"]).first()
    if not c:
        c = Case(
            project_name="Test Jewar Industrial Node",
            purpose_category=PurposeCategory.INDUSTRIAL,
            justification="Corridor acquisition for parcel linkage verification.",
            district_id=test_setup["gb_nagar_id"],
            state_id=test_setup["up_id"],
            requiring_body_user_id=test_setup["c1_id"],
            current_stage=CaseStage.PROPOSAL_SUBMITTED
        )
        db_session.add(c)
        db_session.commit()
        db_session.refresh(c)
    return c


def test_cross_district_collector_blocked_from_parcels(
    client: TestClient,
    token_collector_agra: str
):
    """
    SECURITY INVARIANT:
    District Collector of District 2 (Agra) MUST be blocked with 403 Forbidden
    when requesting parcels in District 1 (Gautam Buddha Nagar).
    """
    resp = client.get(
        "/api/v1/parcels?district=Gautam%20Buddha%20Nagar",
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert resp.status_code == 403
    assert "jurisdiction" in resp.json()["detail"].lower()


def test_authorized_district_collector_can_list_parcels(
    client: TestClient,
    token_collector_gbnagar: str
):
    """
    District Collector of Gautam Buddha Nagar can list parcels in GeoJSON format.
    """
    resp = client.get(
        "/api/v1/parcels?district=Gautam%20Buddha%20Nagar",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 30

    first = data["features"][0]
    assert first["type"] == "Feature"
    assert "geometry" in first
    assert first["geometry"]["type"] == "Polygon"
    assert "properties" in first
    assert "khasra_number" in first["properties"]
    assert "encroachment_status" in first["properties"]
    assert "revenue_sheet_no" in first["properties"]


def test_policy_viewer_global_readonly_and_mutation_blocked(
    client: TestClient,
    token_policy_viewer: str,
    db_session: Session
):
    """
    Policy Viewer has global read access to all parcels,
    but cannot link parcels or mutate them (403 Forbidden).
    """
    # 1. Read is permitted
    resp = client.get(
        "/api/v1/parcels?district=Gautam%20Buddha%20Nagar",
        headers={"Authorization": f"Bearer {token_policy_viewer}"}
    )
    assert resp.status_code == 200

    # 2. Mutation (link-case) is forbidden
    target_parcel = db_session.query(Parcel).filter_by(district="Gautam Buddha Nagar").first()
    assert target_parcel is not None

    link_resp = client.post(
        f"/api/v1/parcels/{target_parcel.id}/link-case",
        json={"case_id": 1},
        headers={"Authorization": f"Bearer {token_policy_viewer}"}
    )
    assert link_resp.status_code == 403


def test_parcel_bbox_filter(
    client: TestClient,
    token_collector_gbnagar: str
):
    """
    Querying with a bounding box returns only parcels whose centroid / geometry intersects.
    """
    # Bbox around Jewar area: lng [77.55, 77.60], lat [28.40, 28.45]
    bbox_str = "77.55,28.40,77.60,28.45"
    resp = client.get(
        f"/api/v1/parcels?district=Gautam%20Buddha%20Nagar&bbox={bbox_str}",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    # Should return filtered subset
    assert 0 < len(data["features"]) < 40
    for f in data["features"]:
        props = f["properties"]
        assert 77.54 <= props["centroid_lng"] <= 77.61
        assert 28.39 <= props["centroid_lat"] <= 28.46


def test_parcel_search_khasra(
    client: TestClient,
    token_collector_gbnagar: str
):
    """
    Partial search by Khasra number returns search items with centroid coordinates for fly-to.
    """
    resp = client.get(
        "/api/v1/parcels/search?khasra_number=100&district=Gautam%20Buddha%20Nagar",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    results = resp.json()
    assert isinstance(results, list)
    assert len(results) > 0
    first = results[0]
    assert "khasra_number" in first
    assert "centroid_lat" in first
    assert "centroid_lng" in first
    assert "100" in first["khasra_number"]


def test_case_parcels_endpoint(
    client: TestClient,
    token_collector_gbnagar: str,
    gb_nagar_case_for_parcels: Case
):
    """
    GET /api/v1/cases/{case_id}/parcels returns GeoJSON FeatureCollection.
    """
    resp = client.get(
        f"/api/v1/cases/{gb_nagar_case_for_parcels.id}/parcels",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data


def test_link_parcel_to_case_with_audit(
    client: TestClient,
    token_collector_gbnagar: str,
    gb_nagar_case_for_parcels: Case,
    db_session: Session
):
    """
    Linking a parcel to a case updates case_id and appends an immutable audit log entry.
    """
    # Pick a parcel that is currently unlinked or from the pool
    parcel = db_session.query(Parcel).filter_by(district="Gautam Buddha Nagar").first()
    assert parcel is not None

    resp = client.post(
        f"/api/v1/parcels/{parcel.id}/link-case",
        json={"case_id": gb_nagar_case_for_parcels.id},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["properties"]["case_id"] == gb_nagar_case_for_parcels.id

    # Verify audit log entry
    audit = db_session.query(AuditLog).filter_by(
        case_id=gb_nagar_case_for_parcels.id,
        action="LINK_PARCEL_TO_CASE"
    ).order_by(AuditLog.id.desc()).first()
    assert audit is not None
    assert parcel.khasra_number in audit.remarks


def test_encroachment_status_update_with_audit_and_evidence(
    client: TestClient,
    token_field_officer: str,
    db_session: Session
):
    """
    Updating encroachment status requires role FIELD_OFFICER, evidence_document_id,
    and creates an atomic audit log entry.
    """
    parcel = db_session.query(Parcel).filter_by(district="Gautam Buddha Nagar").first()
    assert parcel is not None

    # 1. Missing evidence_document_id must fail validation (422)
    bad_resp = client.patch(
        f"/api/v1/parcels/{parcel.id}/encroachment-status",
        json={"encroachment_status": "disputed"},
        headers={"Authorization": f"Bearer {token_field_officer}"}
    )
    assert bad_resp.status_code == 422

    # 2. Valid update with evidence document reference
    valid_resp = client.patch(
        f"/api/v1/parcels/{parcel.id}/encroachment-status",
        json={
            "encroachment_status": "disputed",
            "evidence_document_id": "DOC-SURVEY-2026-99",
            "remarks": "Physical encroachment noted during boundary beaconing."
        },
        headers={"Authorization": f"Bearer {token_field_officer}"}
    )
    assert valid_resp.status_code == 200
    data = valid_resp.json()
    assert data["properties"]["encroachment_status"] == "disputed"

    # Verify audit log entry
    audit = db_session.query(AuditLog).filter_by(
        action="UPDATE_ENCROACHMENT_STATUS"
    ).order_by(AuditLog.id.desc()).first()
    assert audit is not None
    assert "DOC-SURVEY-2026-99" in audit.remarks
