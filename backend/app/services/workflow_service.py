# ==============================================================================
# Layer: Services — Stage Workflows: SIA, Hearings, Objections & R&R (app/services/workflow_service.py)
# ALLOWED:
#   - Implement stage-specific business workflows and state assertions.
#   - Enforce atomic transactions across workflow record writes and audit logs.
# NOT ALLOWED:
#   - NO raw SQL or direct DB session manipulation (delegate to repositories/).
#   - NEVER allow family_status_log or audit_log updates or deletions.
# ==============================================================================

from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.enums import CaseStage, UserRole
from app.models.user import User
from app.models.workflow import SIAVerdict, Objection, AffectedFamily
from app.schemas.workflow import (
    SIAVerdictCreate,
    HearingLogRequest,
    ObjectionCreate,
    FamilyStatusUpdate,
)
from app.repositories.case_repo import CaseRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.workflow_repo import WorkflowRepository
from app.services.jurisdiction import enforce_jurisdiction


class WorkflowService:
    """Specialized workflow logic for SIA, Objections, Hearings, and R&R milestone tracking."""

    @classmethod
    def submit_sia_verdict(
        cls,
        db: Session,
        case_id: int,
        user: User,
        verdict_in: SIAVerdictCreate
    ) -> SIAVerdict:
        """
        Submits expert SIA verdict.
        Enforces sia_expert role, jurisdiction, and verifies case is in sia_in_progress.
        Atomic transaction for SIA verdict + audit log.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        if user.role != UserRole.SIA_EXPERT.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only assigned SIA Experts can submit SIA verdicts."
            )

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        if case.current_stage != CaseStage.SIA_IN_PROGRESS.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot submit SIA verdict: Case is in '{case.current_stage}', must be in '{CaseStage.SIA_IN_PROGRESS.value}'."
            )

        data = verdict_in.model_dump()
        data["case_id"] = case_id
        data["submitted_by_user_id"] = user.id

        try:
            verdict = WorkflowRepository.create_or_update_sia_verdict(db, data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case_id,
                actor_user_id=user.id,
                action="sia_verdict_submitted",
                remarks=f"SIA Verdict recommendation: {verdict_in.recommendation.value}. Cost rating: {verdict_in.cost_rating.value}."
            )
            db.commit()
            db.refresh(verdict)
        except Exception:
            db.rollback()
            raise

        return verdict

    @classmethod
    def log_hearing(
        cls,
        db: Session,
        case_id: int,
        user: User,
        hearing_in: HearingLogRequest
    ) -> SIAVerdict:
        """
        Records the public hearing date and attaches official minutes document.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        try:
            verdict = WorkflowRepository.update_hearing_details(
                db=db,
                case_id=case_id,
                hearing_date=hearing_in.hearing_date,
                minutes_document_id=hearing_in.hearing_minutes_document_id
            )
            if not verdict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SIA verdict must exist before logging public hearing details."
                )

            AuditRepository.create_audit_entry(
                db=db,
                case_id=case_id,
                actor_user_id=user.id,
                action="public_hearing_logged",
                remarks=f"Public hearing held on {hearing_in.hearing_date}. Document ID: {hearing_in.hearing_minutes_document_id}."
            )
            db.commit()
            db.refresh(verdict)
        except Exception:
            db.rollback()
            raise

        return verdict

    @classmethod
    def log_objection(
        cls,
        db: Session,
        case_id: int,
        user: User,
        objection_in: ObjectionCreate
    ) -> Objection:
        """
        Logs a formal land owner or stakeholder objection during the objections window.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        if case.current_stage != CaseStage.OBJECTIONS_WINDOW.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Objections can only be logged during the objections window. Current stage: '{case.current_stage}'."
            )

        data = {
            "case_id": case_id,
            "description": objection_in.description,
            "document_id": objection_in.document_id,
            "logged_by_user_id": user.id
        }

        try:
            objection = WorkflowRepository.create_objection(db, data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case_id,
                actor_user_id=user.id,
                action="objection_logged",
                remarks=f"Objection logged. Document ID: {objection_in.document_id or 'None'}."
            )
            db.commit()
            db.refresh(objection)
        except Exception:
            db.rollback()
            raise

        return objection

    @classmethod
    def update_family_status(
        cls,
        db: Session,
        case_id: int,
        family_id: int,
        user: User,
        status_in: FamilyStatusUpdate
    ) -> AffectedFamily:
        """
        Updates an affected family's R&R milestone status.
        Appends a record to the append-only family_status_log and case audit_log atomically.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        family = WorkflowRepository.get_affected_family_by_id(db, family_id)
        if not family or family.case_id != case_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Affected family not found in this case.")

        log_data = {
            "family_id": family_id,
            "status": status_in.status.value,
            "document_id": status_in.document_id,
            "remarks": status_in.remarks,
            "updated_by_user_id": user.id
        }

        try:
            WorkflowRepository.update_family_rr_status(db, family_id, status_in.status.value)
            WorkflowRepository.create_family_status_log(db, log_data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case_id,
                actor_user_id=user.id,
                action="family_status_updated",
                remarks=f"Family '{family.family_head_name}' status moved to {status_in.status.value}. Evidence Doc: {status_in.document_id or 'None'}."
            )
            db.commit()
            db.refresh(family)
        except Exception:
            db.rollback()
            raise

        return family

    @classmethod
    def get_families_for_case(cls, db: Session, case_id: int, user: User) -> List[AffectedFamily]:
        """Retrieves list of project affected families and milestone status logs."""
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        return WorkflowRepository.get_affected_families_by_case(db, case_id)
