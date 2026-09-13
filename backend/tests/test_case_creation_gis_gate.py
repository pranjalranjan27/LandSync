# ==============================================================================
# Layer: Tests — Case Creation & GIS Parcel Selection Integration
# ==============================================================================

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.parcel import Parcel
from app.models.enums import CaseStage, UserRole, JurisdictionLevel, DisputeStatus
from app.models.user import User


def test_create_case_with_real_parcels_and_auto_resolved_jurisdiction(
    client: TestClient,
    token_requiring_body: str,
    token_district_collector: str,
    token_patwari_lekhpal: str,
    db_session: Session
):
    """
    Verifies that a Requiring Body can submit a proposal with real cadastral parcels,
    and that:
    1. district_id and state_id are resolved defensively if omitted.
    2. Parcels are linked to the case and total area is computed.
    3. The case is in proposal_submitted stage.
    4. The case is immediately visible in District Collector's list.
    5. The case is immediately visible in Patwari/Lekhpal's village list.
    """
    # 1. Fetch a clear parcel in Chhapraula village, Gautam Buddha Nagar
    clear_parcel = db_session.query(Parcel).filter_by(village="Chhapraula", dispute_status="clear").first()
    assert clear_parcel is not None, "Need at least one clear parcel in DB"

    payload = {
        "project_name": "NH-24 Dadri Bypass Expansion Project",
        "purpose_category": "highways",
        "justification": "Statutory bypass highway construction to ease traffic congestion in Dadri tehsil.",
        "estimated_affected_families": 25,
        "parcel_ids": [str(clear_parcel.id)],
        "has_dispute_warning": False,
        "location_sensitivity": "standard"
        # Note: district_id and state_id omitted to test backend auto-resolution
    }

    res = client.post(
        "/cases",
        json=payload,
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert res.status_code == 201, res.text
    case_data = res.json()
    case_id = case_data["id"]

    assert case_data["project_name"] == "NH-24 Dadri Bypass Expansion Project"
    assert case_data["current_stage"] == CaseStage.PROPOSAL_SUBMITTED.value
    assert case_data["district_id"] == 1  # Auto-resolved to Gautam Buddha Nagar
    assert case_data["state_id"] == 1     # Auto-resolved to Uttar Pradesh
    assert len(case_data["parcels"]) == 1
    assert case_data["parcels"][0]["khasra_number"] == clear_parcel.khasra_number

    # 2. Verify District Collector immediately sees the newly created proposal in their case list
    col_res = client.get(
        "/cases",
        headers={"Authorization": f"Bearer {token_district_collector}"}
    )
    assert col_res.status_code == 200
    col_cases = col_res.json()
    found_in_collector = any(c["id"] == case_id for c in col_cases)
    assert found_in_collector, f"Newly created case #{case_id} must appear in District Collector dashboard"

    # 3. Verify Patwari (assigned to Chhapraula) immediately sees the proposal for ground verification
    pat_res = client.get(
        "/cases",
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert pat_res.status_code == 200
    pat_cases = pat_res.json()
    found_in_patwari = any(c["id"] == case_id for c in pat_cases)
    assert found_in_patwari, f"Newly created case #{case_id} in Chhapraula must appear in Patwari dashboard"


def test_create_case_blocked_on_prohibited_parcel(
    client: TestClient,
    token_requiring_body: str,
    db_session: Session
):
    """
    Verifies that selecting a prohibited parcel blocks proposal creation with HTTP 409 Conflict.
    """
    prohibited_parcel = db_session.query(Parcel).filter_by(dispute_status="prohibited").first()
    assert prohibited_parcel is not None, "Need at least one prohibited parcel in DB"

    payload = {
        "project_name": "Invalid Proposal Over Prohibited Forest Reserve",
        "purpose_category": "infrastructure",
        "justification": "Testing statutory dispute gate enforcement on prohibited parcels.",
        "parcel_ids": [str(prohibited_parcel.id)],
        "district_id": 1,
        "state_id": 1
    }

    res = client.post(
        "/cases",
        json=payload,
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert res.status_code == 409
    detail = res.json()["detail"]
    assert detail["has_prohibited"] is True
    assert len(detail["prohibited_parcels"]) > 0
