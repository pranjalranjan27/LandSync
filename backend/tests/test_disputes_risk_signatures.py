import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.parcel import Parcel
from app.models.case import Case
from app.models.enums import CaseStage, DisputeStatus, PurposeCategory
from app.models.document_signature import DocumentSignature
from app.models.workflow import SIAVerdict


def test_parcel_geojson_properties_include_dispute_fields(
    client: TestClient,
    token_collector_gbnagar: str
):
    """
    FEATURE 1 Verification:
    GET /api/v1/parcels must return dispute_status, dispute_source, and dispute_notes
    in GeoJSON properties.
    """
    resp = client.get(
        "/api/v1/parcels?district=Gautam%20Buddha%20Nagar",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

    first_feat = data["features"][0]
    props = first_feat["properties"]
    assert "dispute_status" in props
    assert "dispute_source" in props
    assert "dispute_notes" in props


def test_dispute_gate_prohibited_parcel_blocks_proposal_creation(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_requiring_body: str
):
    """
    FEATURE 1 Verification:
    Pre-Submission GIS Gate blocks proposal creation with HTTP 409 Conflict
    if any selected parcel is 'prohibited' (e.g. Gram Sabha waterbody reserve under UP Revenue Code Sec 77).
    """
    prohibited_parcel = db_session.query(Parcel).filter_by(dispute_status=DisputeStatus.PROHIBITED.value).first()
    assert prohibited_parcel is not None, "Prohibited parcel should be seeded"

    payload = {
        "project_name": "Prohibited Land Acquisition Attempt",
        "purpose_category": PurposeCategory.INFRASTRUCTURE.value,
        "justification": "Testing statutory rejection on prohibited waterbody parcel.",
        "estimated_affected_families": 10,
        "district_id": test_setup["gb_nagar_id"],
        "state_id": test_setup["up_id"],
        "parcel_ids": [str(prohibited_parcel.id)]
    }

    resp = client.post(
        "/api/v1/cases",
        json=payload,
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert resp.status_code == 409
    detail = resp.json()["detail"]
    assert "prohibited" in str(detail).lower()


def test_dispute_gate_litigation_parcel_warns_and_creates(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_requiring_body: str
):
    """
    FEATURE 1 Verification:
    Pre-Submission GIS Gate allows creation if parcel has 'under_litigation',
    but visibly flags the created case with has_dispute_warning = true.
    """
    litigation_parcel = db_session.query(Parcel).filter_by(dispute_status=DisputeStatus.UNDER_LITIGATION.value).first()
    assert litigation_parcel is not None, "Litigation parcel should be seeded"

    payload = {
        "project_name": "Litigation Land Acquisition Proposal",
        "purpose_category": PurposeCategory.HIGHWAYS.value,
        "justification": "Statutory expressway bypass acquisition with active civil suit notice.",
        "estimated_affected_families": 15,
        "district_id": test_setup["gb_nagar_id"],
        "state_id": test_setup["up_id"],
        "parcel_ids": [str(litigation_parcel.id)]
    }

    resp = client.post(
        "/api/v1/cases",
        json=payload,
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert resp.status_code == 201
    case_data = resp.json()
    assert case_data["has_dispute_warning"] is True


def test_risk_assessment_prior_to_sia_complete_returns_409(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_collector_gbnagar: str
):
    """
    FEATURE 2 Verification:
    Calling GET /api/v1/cases/{case_id}/risk-assessment prior to 'sia_complete'
    must return 409 Conflict with 'Risk assessment requires completed SIA data'.
    """
    # Create or find a case in 'proposal_submitted' stage
    case = db_session.query(Case).filter(
        Case.district_id == test_setup["gb_nagar_id"],
        Case.current_stage == CaseStage.PROPOSAL_SUBMITTED.value
    ).first()
    assert case is not None

    resp = client.get(
        f"/api/v1/cases/{case.id}/risk-assessment",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 409
    assert "Risk assessment requires completed SIA data" in resp.json()["detail"]


def test_risk_assessment_computation_at_sia_complete(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_collector_gbnagar: str,
    token_policy_viewer: str
):
    """
    FEATURE 2 Verification:
    Case at 'sia_complete' or later computes risk score (0-100), risk band,
    and returns explainable component breakdown on read.
    """
    # Create a test case at sia_complete with linked parcels and SIA verdict
    clear_parcels = db_session.query(Parcel).filter_by(
        dispute_status=DisputeStatus.CLEAR.value,
        district="Gautam Buddha Nagar"
    ).limit(3).all()

    case = Case(
        project_name="Jewar Multi-Modal Freight Hub",
        purpose_category=PurposeCategory.INFRASTRUCTURE.value,
        justification="SIA completed with expert committee approval.",
        estimated_affected_families=45,
        has_dispute_warning=False,
        location_sensitivity="dense_urban",
        district_id=test_setup["gb_nagar_id"],
        state_id=test_setup["up_id"],
        requiring_body_user_id=test_setup["rb_id"],
        current_stage="sia_complete"
    )
    db_session.add(case)
    db_session.flush()

    for p in clear_parcels:
        case.parcels.append(p)
        p.case_id = case.id

    sia = SIAVerdict(
        case_id=case.id,
        agree_public_purpose=True,
        min_land_confirmed=True,
        alternate_location_feasible=False,
        independent_family_estimate=52,
        cost_rating="medium",
        recommendation="proceed",
        submitted_by_user_id=test_setup["c1_id"]
    )
    db_session.add(sia)
    db_session.commit()
    db_session.refresh(case)

    # Collector reads risk assessment
    resp = client.get(
        f"/api/v1/cases/{case.id}/risk-assessment",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_id"] == case.id
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_band"] in ("low", "medium", "high")
    
    comp = data["components"]
    assert "affected_families_score" in comp
    assert "dispute_score" in comp
    assert "cost_density_score" in comp
    assert "location_sensitivity_score" in comp
    assert comp["affected_families_count"] == 52

    # Policy Viewer can also read risk assessment globally
    resp_pv = client.get(
        f"/api/v1/cases/{case.id}/risk-assessment",
        headers={"Authorization": f"Bearer {token_policy_viewer}"}
    )
    assert resp_pv.status_code == 200


def test_cross_district_collector_blocked_from_risk_assessment(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_collector_agra: str
):
    """
    FEATURE 2 Verification:
    Collector from Agra is blocked with 403 Forbidden when requesting risk assessment
    for a case located in Gautam Buddha Nagar.
    """
    case = db_session.query(Case).filter(
        Case.district_id == test_setup["gb_nagar_id"],
        Case.current_stage == "sia_complete"
    ).first()
    assert case is not None

    resp = client.get(
        f"/api/v1/cases/{case.id}/risk-assessment",
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert resp.status_code == 403
    assert "jurisdiction" in resp.json()["detail"].lower()


def test_atomic_digital_signature_on_publish_notification(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_collector_gbnagar: str
):
    """
    FEATURE 3 Verification:
    Publishing Section 11 Preliminary Notification atomically creates a DocumentSignature
    with SHA-256 payload hash and records an immutable audit log entry in the same transaction.
    """
    case = db_session.query(Case).filter_by(
        district_id=test_setup["gb_nagar_id"],
        current_stage="sia_complete"
    ).first()
    assert case is not None

    resp = client.post(
        f"/api/v1/cases/{case.id}/actions/publish_notification",
        json={"notification_number": "NOTIF/UP/2026/042", "document_id": None, "remarks": "Gazetted in UP State Gazette"},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    case_detail = resp.json()
    assert case_detail["current_stage"] == CaseStage.OBJECTIONS_WINDOW.value

    # Verify signature was persisted
    sig = db_session.query(DocumentSignature).filter_by(
        case_id=case.id,
        action_type="notification_published"
    ).first()
    assert sig is not None
    assert len(sig.payload_hash) == 64  # SHA-256 64-char hex string
    assert sig.signer_user_id == test_setup["c1_id"]
    assert "District" in sig.signer_jurisdiction


def test_list_case_signatures_endpoint(
    client: TestClient,
    db_session: Session,
    test_setup,
    token_collector_gbnagar: str
):
    """
    FEATURE 3 Verification:
    GET /api/v1/cases/{case_id}/signatures returns all digital signatures attached to the case.
    """
    sig = db_session.query(DocumentSignature).first()
    assert sig is not None

    resp = client.get(
        f"/api/v1/cases/{sig.case_id}/signatures",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    sigs = resp.json()
    assert len(sigs) >= 1
    assert sigs[0]["payload_hash"] == sig.payload_hash
    assert sigs[0]["signer_role"] == "district_collector"
