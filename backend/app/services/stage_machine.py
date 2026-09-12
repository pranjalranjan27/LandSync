# ==============================================================================
# Layer: Services — Stage Transition State Machine (app/services/stage_machine.py)
# ALLOWED:
#   - Define the explicit legal workflow transition graph for LandSync.
#   - Validate transition requests against the graph and reject illegal transitions
#     with HTTP 409 Conflict.
# NOT ALLOWED:
#   - Do NOT query the database or check user permissions here.
#   - This is a pure domain validation engine.
# ==============================================================================

from typing import Dict, List
from fastapi import HTTPException, status

from app.models.enums import CaseStage

# The explicit, canonical allowed-transitions map.
# Key: Current Stage -> Value: List of permissible next stages.
ALLOWED_TRANSITIONS: Dict[CaseStage, List[CaseStage]] = {
    CaseStage.PROPOSAL_SUBMITTED: [
        CaseStage.DISTRICT_REVIEW,
        CaseStage.RETURNED_FOR_CLARIFICATION,
        CaseStage.REJECTED
    ],
    CaseStage.DISTRICT_REVIEW: [
        CaseStage.STATE_REVIEW,
        CaseStage.RETURNED_FOR_CLARIFICATION,
        CaseStage.REJECTED
    ],
    CaseStage.STATE_REVIEW: [
        CaseStage.SIA_IN_PROGRESS,
        CaseStage.RETURNED_FOR_CLARIFICATION,
        CaseStage.REJECTED
    ],
    CaseStage.SIA_IN_PROGRESS: [
        CaseStage.NOTIFICATION_PUBLISHED,
        CaseStage.RETURNED_FOR_CLARIFICATION,
        CaseStage.REJECTED
    ],
    CaseStage.NOTIFICATION_PUBLISHED: [
        CaseStage.OBJECTIONS_WINDOW
    ],
    CaseStage.OBJECTIONS_WINDOW: [
        CaseStage.AWARD_DECLARED,
        CaseStage.RETURNED_FOR_CLARIFICATION
    ],
    CaseStage.AWARD_DECLARED: [
        CaseStage.COMPENSATION_DISBURSED
    ],
    CaseStage.COMPENSATION_DISBURSED: [
        CaseStage.POSSESSION_TAKEN
    ],
    CaseStage.POSSESSION_TAKEN: [
        CaseStage.RR_IN_PROGRESS,
        CaseStage.COMPLETED
    ],
    CaseStage.RR_IN_PROGRESS: [
        CaseStage.COMPLETED
    ],
    CaseStage.RETURNED_FOR_CLARIFICATION: [
        CaseStage.PROPOSAL_SUBMITTED,
        CaseStage.DISTRICT_REVIEW
    ],
    # Terminal states: no forward transitions allowed
    CaseStage.REJECTED: [],
    CaseStage.COMPLETED: []
}


def validate_stage_transition(current_stage_str: str, target_stage_str: str) -> None:
    """
    Validates whether moving from current_stage to target_stage is legally permissible.
    Raises HTTPException(409 Conflict) with a descriptive error if the transition is illegal.
    """
    try:
        current = CaseStage(current_stage_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown current stage '{current_stage_str}'."
        )

    try:
        target = CaseStage(target_stage_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown target stage '{target_stage_str}'."
        )

    allowed_targets = ALLOWED_TRANSITIONS.get(current, [])
    if target not in allowed_targets:
        allowed_names = [s.value for s in allowed_targets]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Illegal stage transition from '{current.value}' to '{target.value}'. "
                f"Statutory workflow permits only: {allowed_names or 'None (terminal state)'}."
            )
        )
