import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.enums import UserRole, JurisdictionLevel, LandVerificationStatus, CaseStage
from app.models.case import Case
from app.models.parcel import Parcel
from app.models.land_verification import LandVerificationRecord
from app.core.security import create_access_token


@pytest.fixture
def verification_case(db_session: Session, test_setup: dict) -> Case:
    """Fixture ensuring a case exists in GB Nagar with a parcel in Chhapraula village, Dadri tehsil."""
    p = db_session.query(Parcel).filter_by(village="Chhapraula").first()
    if not p:
        p = Parcel(
            khasra_number="101/1",
            village="Chhapraula",
            tehsil="Dadri",
            district="Gautam Buddha Nagar",
            area_acres=2.5,
            land_type="agricultural",
            district_id=test_setup["gb_nagar_id"],
            wkt_geometry="POLYGON((77.45 28.55, 77.46 28.55, 77.46 28.56, 77.45 28.56, 77.45 28.55))"
        )
        db_session.add(p)
        db_session.commit()
        db_session.refresh(p)
    else:
        p.tehsil = "Dadri"
        p.village = "Chhapraula"
        p.district_id = test_setup["gb_nagar_id"]
        db_session.commit()

    case = db_session.query(Case).filter_by(project_name="Section 4 Gate Verification Test Case").first()
    if not case:
        case = Case(
            project_name="Section 4 Gate Verification Test Case",
            requiring_body_user_id=test_setup["rb_id"],
            purpose_category="highways",
            justification="Testing Section 4 Patwari-Tehsildar Land Verification Gate",
            estimated_affected_families=12,
            district_id=test_setup["gb_nagar_id"],
            state_id=test_setup["up_id"],
            current_stage=CaseStage.PROPOSAL_SUBMITTED.value
        )
        db_session.add(case)
        db_session.commit()
        db_session.refresh(case)

    p.case_id = case.id
    db_session.commit()
    db_session.refresh(case)
    return case


def test_patwari_submit_verification_success(
    client: TestClient,
    token_patwari_lekhpal: str,
    verification_case: Case,
    db_session: Session
):
    """
    Patwari/Lekhpal submits Section 4 land verification for a case in their assigned village.
    """
    db_session.query(LandVerificationRecord).filter_by(case_id=verification_case.id).delete()
    db_session.commit()

    p = db_session.query(Parcel).filter_by(case_id=verification_case.id).first()

    payload = {
        "parcel_ids": [str(p.id)] if p else [],
        "khasra_ownership_confirmed": True,
        "ownership_notes": "Title verified against Jamabandi 1431F.",
        "boundary_verification_notes": "Physical DGPS boundary survey cross-verified with Shajra map.",
        "asset_inventory": [
            {"type": "tree", "description": "15 Mature Sheesham trees", "estimated_count_or_area": "15 trees"},
            {"type": "well", "description": "1 Masonry tube-well", "estimated_count_or_area": "1 unit"}
        ],
        "notice_served_at": "2026-09-10T10:00:00Z",
        "notice_served_notes": "Served personally on all khatedars."
    }

    res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json=payload,
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["case_id"] == verification_case.id
    assert data["status"] == LandVerificationStatus.SUBMITTED.value
    assert data["khasra_ownership_confirmed"] is True
    assert len(data["asset_inventory"]) == 2


def test_unauthorized_role_cannot_submit_verification(
    client: TestClient,
    token_state_approver: str,
    verification_case: Case
):
    """Only patwari_lekhpal role can submit land verification."""
    res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json={
            "boundary_verification_notes": "Attempted by unauthorized officer"
        },
        headers={"Authorization": f"Bearer {token_state_approver}"}
    )
    assert res.status_code == 403


def test_patwari_wrong_village_forbidden(
    client: TestClient,
    verification_case: Case,
    test_setup: dict,
    db_session: Session
):
    """Patwari assigned to village 'Rohi' cannot submit verification for 'Chhapraula' case."""
    from app.models.user import User
    from app.core.security import get_password_hash

    rohi_user = db_session.query(User).filter_by(email="patwari_rohi@test.gov.in").first()
    if not rohi_user:
        rohi_user = User(
            name="Test Patwari Rohi",
            email="patwari_rohi@test.gov.in",
            hashed_password=get_password_hash("password123"),
            role=UserRole.PATWARI_LEKHPAL,
            jurisdiction_level=JurisdictionLevel.VILLAGE,
            jurisdiction_id=test_setup["gb_nagar_id"],
            jurisdiction_value="Rohi"
        )
        db_session.add(rohi_user)
        db_session.commit()
        db_session.refresh(rohi_user)

    token_wrong_village = create_access_token(
        subject=rohi_user.id,
        claims={
            "role": UserRole.PATWARI_LEKHPAL.value,
            "jurisdiction_level": JurisdictionLevel.VILLAGE.value,
            "jurisdiction_id": test_setup["gb_nagar_id"],
            "jurisdiction_value": "Rohi"
        }
    )

    res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json={
            "khasra_ownership_confirmed": True,
            "boundary_verification_notes": "Cross-village inspection attempt",
            "asset_inventory": []
        },
        headers={"Authorization": f"Bearer {token_wrong_village}"}
    )
    assert res.status_code == 403
    assert "village" in res.json()["detail"].lower()


def test_tehsildar_certify_success(
    client: TestClient,
    token_patwari_lekhpal: str,
    token_tehsildar: str,
    verification_case: Case,
    db_session: Session
):
    """
    Tehsildar in Dadri tehsil certifies a submitted land verification record.
    """
    db_session.query(LandVerificationRecord).filter_by(case_id=verification_case.id).delete()
    db_session.commit()

    sub_res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json={
            "khasra_ownership_confirmed": True,
            "boundary_verification_notes": "Survey notes for certification test",
            "asset_inventory": []
        },
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert sub_res.status_code == 201
    record_id = sub_res.json()["id"]

    cert_res = client.patch(
        f"/land-verification/{record_id}/certify",
        headers={"Authorization": f"Bearer {token_tehsildar}"}
    )
    assert cert_res.status_code == 200, cert_res.text
    cert_data = cert_res.json()
    assert cert_data["status"] == LandVerificationStatus.CERTIFIED.value
    assert cert_data["certified_by_tehsildar_name"] is not None
    assert cert_data["certified_at"] is not None


def test_tehsildar_wrong_tehsil_forbidden(
    client: TestClient,
    token_patwari_lekhpal: str,
    token_tehsildar_other: str,
    verification_case: Case,
    db_session: Session
):
    """Tehsildar in 'Jewar' cannot certify a case situated in 'Dadri'."""
    db_session.query(LandVerificationRecord).filter_by(case_id=verification_case.id).delete()
    db_session.commit()

    sub_res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json={
            "khasra_ownership_confirmed": True,
            "boundary_verification_notes": "Survey notes for cross-tehsil test",
            "asset_inventory": []
        },
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert sub_res.status_code == 201
    record_id = sub_res.json()["id"]

    cert_res = client.patch(
        f"/land-verification/{record_id}/certify",
        headers={"Authorization": f"Bearer {token_tehsildar_other}"}
    )
    assert cert_res.status_code == 403
    assert "tehsil" in cert_res.json()["detail"].lower()


def test_tehsildar_return_for_correction(
    client: TestClient,
    token_patwari_lekhpal: str,
    token_tehsildar: str,
    verification_case: Case,
    db_session: Session
):
    """Tehsildar returns verification with statutory deficiency notes."""
    db_session.query(LandVerificationRecord).filter_by(case_id=verification_case.id).delete()
    db_session.commit()

    sub_res = client.post(
        f"/cases/{verification_case.id}/land-verification",
        json={
            "khasra_ownership_confirmed": False,
            "boundary_verification_notes": "Survey with boundary discrepancies",
            "asset_inventory": []
        },
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert sub_res.status_code == 201
    record_id = sub_res.json()["id"]

    ret_res = client.patch(
        f"/land-verification/{record_id}/return",
        json={"notes": "Re-verify northern boundary stone coordinates with RI."},
        headers={"Authorization": f"Bearer {token_tehsildar}"}
    )
    assert ret_res.status_code == 200
    ret_data = ret_res.json()
    assert ret_data["status"] == LandVerificationStatus.RETURNED_FOR_CORRECTION.value
    assert "boundary stone" in ret_data["tehsildar_notes"]


def test_state_review_gate_blocks_uncertified_proposal(
    client: TestClient,
    token_district_collector: str,
    token_patwari_lekhpal: str,
    token_tehsildar: str,
    test_setup: dict,
    db_session: Session
):
    """
    CRITICAL STATUTORY INVARIANT:
    Advancing a proposal from proposal_submitted to state_review MUST be blocked with HTTP 409
    if Land Verification is not certified by Tehsildar.
    """
    # Create an isolated case in district_review
    case = Case(
        project_name="Isolated Gated Project For Section 4",
        requiring_body_user_id=test_setup["rb_id"],
        purpose_category="highways",
        justification="Section 4 statutory gate verification test",
        estimated_affected_families=10,
        district_id=test_setup["gb_nagar_id"],
        state_id=test_setup["up_id"],
        current_stage=CaseStage.DISTRICT_REVIEW.value
    )
    db_session.add(case)
    db_session.commit()
    db_session.refresh(case)

    # Link an existing parcel to this case
    p = db_session.query(Parcel).filter_by(village="Chhapraula").first()
    if p:
        p.case_id = case.id
        db_session.commit()

    # 1. Attempt to advance to State Review without ANY verification record -> MUST fail with 409
    res_no_ver = client.post(
        f"/cases/{case.id}/actions/approve",
        headers={"Authorization": f"Bearer {token_district_collector}"}
    )
    assert res_no_ver.status_code == 409
    assert "Land verification not yet certified by Tehsildar" in res_no_ver.json()["detail"]

    # 2. Submit verification (status = submitted, NOT certified) -> MUST still fail with 409
    sub_res = client.post(
        f"/cases/{case.id}/land-verification",
        json={
            "khasra_ownership_confirmed": True,
            "boundary_verification_notes": "Boundary stones verified",
            "asset_inventory": []
        },
        headers={"Authorization": f"Bearer {token_patwari_lekhpal}"}
    )
    assert sub_res.status_code == 201
    record_id = sub_res.json()["id"]

    res_sub_ver = client.post(
        f"/cases/{case.id}/actions/approve",
        headers={"Authorization": f"Bearer {token_district_collector}"}
    )
    assert res_sub_ver.status_code == 409
    assert "Land verification not yet certified by Tehsildar" in res_sub_ver.json()["detail"]

    # 3. Tehsildar certifies record -> NOW advancing to State Review MUST succeed (200)
    cert_res = client.patch(
        f"/land-verification/{record_id}/certify",
        headers={"Authorization": f"Bearer {token_tehsildar}"}
    )
    assert cert_res.status_code == 200

    res_ok = client.post(
        f"/cases/{case.id}/actions/approve",
        headers={"Authorization": f"Bearer {token_district_collector}"}
    )
    assert res_ok.status_code == 200
    assert res_ok.json()["current_stage"] == CaseStage.STATE_REVIEW.value


def test_tehsildar_queue(
    client: TestClient,
    token_tehsildar: str,
    test_setup: dict
):
    """Tehsildar queue returns submitted records awaiting review."""
    res = client.get(
        "/land-verification/tehsildar-queue",
        headers={"Authorization": f"Bearer {token_tehsildar}"}
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)
