import pytest
from sqlalchemy.orm import Session

from app.repositories.audit_repo import AuditRepository
from app.models.audit import AuditLog
from app.models.case import Case


def test_audit_repository_has_no_delete_or_update_methods():
    """
    CRITICAL ARCHITECTURAL CONSTRAINT:
    The statutory audit trail must be strictly append-only.
    AuditRepository must not contain any generic update, edit, delete, or purge functions.
    """
    repo_methods = [
        attr for attr in dir(AuditRepository)
        if callable(getattr(AuditRepository, attr)) and not attr.startswith("__")
    ]

    # Assert no delete or purge methods exist
    forbidden_prefixes = ["delete", "remove", "purge", "drop", "destroy", "clear"]
    for method in repo_methods:
        for prefix in forbidden_prefixes:
            assert not method.lower().startswith(prefix), (
                f"AuditRepository violates append-only invariant by defining '{method}'."
            )

    # Assert no generic update methods exist (only specific supervisor flagging is allowed)
    forbidden_updates = ["update", "edit", "modify", "patch"]
    for method in repo_methods:
        for verb in forbidden_updates:
            assert not method.lower().startswith(verb), (
                f"AuditRepository violates immutability invariant by defining '{method}'."
            )


def test_audit_entry_creation_and_chronology(db_session: Session, test_setup):
    """Verify appending audit logs strictly preserves actor, action, and chronological ordering."""
    case = db_session.query(Case).filter_by(district_id=test_setup["gb_nagar_id"]).first()
    assert case is not None

    initial_count = len(AuditRepository.get_audit_logs_for_case(db_session, case.id))

    # Create first entry
    entry1 = AuditRepository.create_audit_entry(
        db=db_session,
        case_id=case.id,
        actor_user_id=test_setup["c1_id"],
        action="test_action_step_1",
        remarks="Initial statutory review comment"
    )
    db_session.commit()

    # Create second entry
    entry2 = AuditRepository.create_audit_entry(
        db=db_session,
        case_id=case.id,
        actor_user_id=test_setup["c1_id"],
        action="test_action_step_2",
        remarks="Follow-up action comment"
    )
    db_session.commit()

    logs = AuditRepository.get_audit_logs_for_case(db_session, case.id)
    assert len(logs) == initial_count + 2

    # Most recent entry is first (ordered desc by created_at)
    assert logs[0].action == "test_action_step_2"
    assert logs[0].actor_user_id == test_setup["c1_id"]
    assert logs[0].remarks == "Follow-up action comment"


def test_flagging_leaves_core_audit_fields_untouched(db_session: Session, test_setup):
    """Flagging for review may only set flagged status, leaving actor, action, and timestamp intact."""
    case = db_session.query(Case).filter_by(district_id=test_setup["gb_nagar_id"]).first()

    entry = AuditRepository.create_audit_entry(
        db=db_session,
        case_id=case.id,
        actor_user_id=test_setup["c1_id"],
        action="disbursement_audit",
        remarks="Solatium released under Section 31"
    )
    db_session.commit()

    orig_actor = entry.actor_user_id
    orig_action = entry.action
    orig_remarks = entry.remarks
    orig_created_at = entry.created_at

    # Supervisor flags entry
    flagged_entry = AuditRepository.flag_audit_entry(
        db=db_session,
        entry_id=entry.id,
        flagged_by_user_id=test_setup["sa_id"]
    )
    db_session.commit()

    assert flagged_entry is not None
    assert flagged_entry.flagged is True
    assert flagged_entry.flagged_by_user_id == test_setup["sa_id"]

    # Invariant checks: Core historical data must remain identical
    assert flagged_entry.actor_user_id == orig_actor
    assert flagged_entry.action == orig_action
    assert flagged_entry.remarks == orig_remarks
    assert flagged_entry.created_at == orig_created_at
