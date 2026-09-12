import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.models.enums import CaseStage
from app.services.stage_machine import validate_stage_transition, ALLOWED_TRANSITIONS


def test_valid_stage_transitions_pass():
    """Assert valid forward transitions pass without raising exceptions."""
    # Proposal Submitted -> District Review is valid
    validate_stage_transition(CaseStage.PROPOSAL_SUBMITTED.value, CaseStage.DISTRICT_REVIEW.value)

    # District Review -> State Review is valid
    validate_stage_transition(CaseStage.DISTRICT_REVIEW.value, CaseStage.STATE_REVIEW.value)

    # Returned for clarification -> Proposal Submitted is valid (clarification loop)
    validate_stage_transition(CaseStage.RETURNED_FOR_CLARIFICATION.value, CaseStage.PROPOSAL_SUBMITTED.value)


def test_illegal_stage_skip_rejected_with_409():
    """
    CRITICAL WORKFLOW INVARIANT:
    Skipping statutory stages (e.g. proposal_submitted -> award_declared)
    MUST be rejected with HTTP 409 Conflict.
    """
    with pytest.raises(HTTPException) as exc_info:
        validate_stage_transition(CaseStage.PROPOSAL_SUBMITTED.value, CaseStage.AWARD_DECLARED.value)

    assert exc_info.value.status_code == 409
    assert "Illegal stage transition" in exc_info.value.detail
    assert "award_declared" in exc_info.value.detail


def test_terminal_states_reject_all_outgoing_transitions():
    """Rejected and Completed are statutory terminal states and permit no forward transitions."""
    with pytest.raises(HTTPException) as exc_info_rejected:
        validate_stage_transition(CaseStage.REJECTED.value, CaseStage.PROPOSAL_SUBMITTED.value)
    assert exc_info_rejected.value.status_code == 409

    with pytest.raises(HTTPException) as exc_info_completed:
        validate_stage_transition(CaseStage.COMPLETED.value, CaseStage.POSSESSION_TAKEN.value)
    assert exc_info_completed.value.status_code == 409


def test_allowed_transitions_map_is_complete():
    """Assert all CaseStage enum values are accounted for in the transition state machine."""
    for stage in CaseStage:
        assert stage in ALLOWED_TRANSITIONS, f"Stage {stage} is missing from ALLOWED_TRANSITIONS mapping."
