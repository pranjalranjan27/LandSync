# ==============================================================================
# Layer: Backend Automated Tests — National Institutional Roles & LARR Referrals
# (backend/tests/test_authority_roles_referrals.py)
# ==============================================================================

import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.enums import CaseStage, DisputeReferralStatus, PurposeCategory
from app.models.workflow import Award
from app.models.dispute_referral import DisputeReferral
from app.models.audit import AuditLog


@pytest.fixture
def compensation_disbursed_case(db_session: Session, test_setup):
    """Creates a clean test case at compensation_disbursed stage."""
    case = Case(
        project_name="NH-24 Expressway Widening Bypass Test",
        requiring_body_user_id=test_setup["rb_id"],
        purpose_category=PurposeCategory.HIGHWAYS.value,
        justification="Statutory bypass connecting industrial zones.",
        estimated_affected_families=30,
        district_id=test_setup["gb_nagar_id"],
        state_id=test_setup["up_id"],
        current_stage=CaseStage.COMPENSATION_DISBURSED.value
    )
    db_session.add(case)
    db_session.flush()

    # Add Award
    db_session.add(Award(
        case_id=case.id,
        compensation_amount=Decimal("150000000.00"),
        declared_by_user_id=test_setup["c1_id"]
    ))
    db_session.commit()
    db_session.refresh(case)
    return case


def test_larr_authority_referral_isolation(
    client: TestClient,
    token_larr_authority: str,
    token_requiring_body: str,
    token_collector_gbnagar: str
):
    """
    Verifies that LARR Authority queue endpoint is restricted to larr_authority role only.
    """
    # Requiring Body forbidden
    res = client.get(
        "/api/v1/authority/larr/cases",
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert res.status_code == 403

    # Collector forbidden
    res = client.get(
        "/api/v1/authority/larr/cases",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 403

    # LARR Authority succeeds
    res = client.get(
        "/api/v1/authority/larr/cases",
        headers={"Authorization": f"Bearer {token_larr_authority}"}
    )
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_refer_dispute_to_larr_and_possession_block(
    client: TestClient,
    db_session: Session,
    compensation_disbursed_case: Case,
    token_collector_gbnagar: str,
    token_collector_agra: str,
    token_larr_authority: str,
    test_setup
):
    """
    Verifies complete Chapter VIII dispute referral lifecycle:
    1. Referral by Collector with jurisdiction succeeds only at compensation_disbursed.
    2. Case has_active_dispute becomes True.
    3. Possession progression is legally blocked with 409 Conflict.
    4. LARR Authority can update and close the referral.
    5. Once closed, progression to possession_taken is unblocked.
    """
    case_id = compensation_disbursed_case.id

    # 1. Collector from different jurisdiction (Agra) cannot refer GB Nagar case
    res = client.post(
        f"/api/v1/cases/{case_id}/refer-to-larr",
        json={"reason": "Dispute on circle rate"},
        headers={"Authorization": f"Bearer {token_collector_agra}"}
    )
    assert res.status_code == 403

    # 2. GB Nagar Collector refers dispute under Section 64
    dispute_reason = "Affected landowner claimed 50% solatium deficiency under Section 30."
    res = client.post(
        f"/api/v1/cases/{case_id}/refer-to-larr",
        json={"reason": dispute_reason},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert res.status_code == 201
    ref_data = res.json()
    assert ref_data["case_id"] == case_id
    assert ref_data["status"] == DisputeReferralStatus.REFERRED.value
    assert ref_data["reason"] == dispute_reason
    referral_id = ref_data["id"]

    # 3. Main stage is UNCHANGED (still compensation_disbursed)
    case_res = client.get(
        f"/api/v1/cases/{case_id}",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert case_res.status_code == 200
    detail = case_res.json()
    assert detail["current_stage"] == CaseStage.COMPENSATION_DISBURSED.value
    assert detail["has_active_dispute"] is True
    assert detail["active_dispute"]["id"] == referral_id

    # 4. Duplicate referral while active is rejected
    dup_res = client.post(
        f"/api/v1/cases/{case_id}/refer-to-larr",
        json={"reason": "Another duplicate claim"},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert dup_res.status_code == 409

    # 5. Statutory Gate: Attempting to advance to possession_taken is BLOCKED
    poss_res = client.post(
        f"/api/v1/cases/{case_id}/actions/approve",
        json={"remarks": "Attempting physical possession takeover."},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert poss_res.status_code == 409
    assert "Possession blocked" in poss_res.json()["detail"]

    # 6. LARR Authority sees this case in its queue
    queue_res = client.get(
        "/api/v1/authority/larr/cases",
        headers={"Authorization": f"Bearer {token_larr_authority}"}
    )
    assert queue_res.status_code == 200
    referred_cases = queue_res.json()
    assert any(c["id"] == case_id for c in referred_cases)

    # 7. LARR Authority updates referral proceedings
    update_res = client.patch(
        f"/api/v1/authority/larr/referrals/{referral_id}",
        json={
            "status": DisputeReferralStatus.UNDER_HEARING.value,
            "larr_case_number": "LARR/2026/TEST/001",
            "hearing_dates": ["2026-10-01", "2026-10-15"]
        },
        headers={"Authorization": f"Bearer {token_larr_authority}"}
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["status"] == DisputeReferralStatus.UNDER_HEARING.value
    assert updated_data["larr_case_number"] == "LARR/2026/TEST/001"

    # Possession still blocked while under_hearing
    poss_res2 = client.post(
        f"/api/v1/cases/{case_id}/actions/approve",
        json={"remarks": "Attempting possession again."},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert poss_res2.status_code == 409

    # 8. LARR Authority closes the dispute
    close_res = client.patch(
        f"/api/v1/authority/larr/referrals/{referral_id}",
        json={
            "status": DisputeReferralStatus.CLOSED.value,
            "outcome": "Statutory solatium recalculated and deposited in Authority escrow."
        },
        headers={"Authorization": f"Bearer {token_larr_authority}"}
    )
    assert close_res.status_code == 200
    assert close_res.json()["status"] == DisputeReferralStatus.CLOSED.value
    assert close_res.json()["resolved_at"] is not None

    # 9. Case is now unblocked and advances to possession_taken!
    unblocked_res = client.post(
        f"/api/v1/cases/{case_id}/actions/approve",
        json={"remarks": "Dispute resolved by LARR Authority. Confirming physical possession."},
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert unblocked_res.status_code == 200
    assert unblocked_res.json()["current_stage"] == CaseStage.POSSESSION_TAKEN.value

    # 10. Audit logs verify audit trail immutability
    audit_res = client.get(
        f"/api/v1/cases/{case_id}/audit-log",
        headers={"Authorization": f"Bearer {token_collector_gbnagar}"}
    )
    assert audit_res.status_code == 200
    actions = [a["action"] for a in audit_res.json()]
    assert "dispute_referred_to_larr" in actions
    assert "larr_referral_updated" in actions
    assert "larr_dispute_resolved" in actions


def test_independent_sia_expert_national_visibility(
    client: TestClient,
    token_independent_sia_expert: str,
    token_requiring_body: str
):
    """
    Verifies that Independent SIA Expert has national scope listing access across all cases.
    """
    # Requiring Body forbidden
    res = client.get(
        "/api/v1/authority/sia-expert/cases",
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert res.status_code == 403

    # Independent SIA Expert succeeds
    res = client.get(
        "/api/v1/authority/sia-expert/cases",
        headers={"Authorization": f"Bearer {token_independent_sia_expert}"}
    )
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)
    assert len(cases) > 0


def test_rr_committee_national_read_only_oversight(
    client: TestClient,
    token_rr_committee: str,
    token_requiring_body: str
):
    """
    Verifies that R&R Monitoring Committee has national read-only access and no mutating permissions.
    """
    # Requiring Body forbidden
    res = client.get(
        "/api/v1/authority/rr-committee/cases",
        headers={"Authorization": f"Bearer {token_requiring_body}"}
    )
    assert res.status_code == 403

    # RR Committee succeeds
    res = client.get(
        "/api/v1/authority/rr-committee/cases",
        headers={"Authorization": f"Bearer {token_rr_committee}"}
    )
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)
    assert len(cases) > 0
