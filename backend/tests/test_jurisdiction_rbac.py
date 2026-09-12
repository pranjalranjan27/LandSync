import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.enums import CaseStage, PurposeCategory


@pytest.fixture
def gb_nagar_case(db_session: Session, test_setup) -> Case:
    """Ensure at least one case exists in GB Nagar."""
    c = db_session.query(Case).filter_by(district_id=test_setup["gb_nagar_id"]).first()
    if not c:
        c = Case(
            project_name="Test GB Nagar Highway Corridor",
            purpose_category=PurposeCategory.INFRASTRUCTURE,
            justification="Test acquisition corridor for jurisdiction isolation verification.",
            district_id=test_setup["gb_nagar_id"],
            state_id=test_setup["up_id"],
            requiring_body_user_id=test_setup["c1_id"],
            current_stage=CaseStage.PROPOSAL_SUBMITTED
        )
        db_session.add(c)
        db_session.commit()
        db_session.refresh(c)
    return c


def test_unauthenticated_request_rejected(client: TestClient, gb_nagar_case: Case):
    """Assert requests without bearer token return 401 Unauthorized."""
    resp = client.get(f"/cases/{gb_nagar_case.id}")
    assert resp.status_code == 401


def test_district_collector_can_view_own_district_case(
    client: TestClient,
    gb_nagar_case: Case,
    token_collector_gbnagar: str
):
    """District Collector of District 1 can view District 1 cases."""
    resp = client.get(
        f"/cases/{gb_nagar_case.id}",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == gb_nagar_case.id
    assert data["district_id"] == gb_nagar_case.district_id


def test_cross_district_collector_blocked_with_403(
    client: TestClient,
    gb_nagar_case: Case,
    token_collector_agra: str
):
    """
    CRITICAL SECURITY INVARIANT:
    District Collector of District 2 (Agra) MUST be blocked with 403 Forbidden
    when attempting to access a case in District 1 (GB Nagar).
    """
    resp = client.get(
        f"/cases/{gb_nagar_case.id}",
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert resp.status_code == 403
    assert "jurisdiction" in resp.json()["detail"].lower()


def test_state_approver_can_view_subordinate_district_case(
    client: TestClient,
    gb_nagar_case: Case,
    token_state_approver: str
):
    """State Approver whose jurisdiction covers the State can view any district case within that State."""
    resp = client.get(
        f"/cases/{gb_nagar_case.id}",
        headers={"Authorization": f"Bearer {token_state_approver}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == gb_nagar_case.id
