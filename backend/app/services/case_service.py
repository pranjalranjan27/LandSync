# ==============================================================================
# Layer: Services — Case Lifecycle & Workflow Orchestration (app/services/case_service.py)
# ALLOWED:
#   - Orchestrate case business logic, RBAC role checks, ABAC jurisdiction checks,
#     stage transition validation, and SLA overdue calculations.
#   - Enforce transactional integrity: every state mutation MUST atomically write
#     an audit log row in the same database transaction.
# NOT ALLOWED:
#   - NEVER execute raw SQL or ORM query construction (delegate to repositories/).
#   - Routers must call this service and not touch repositories or database sessions directly.
# ==============================================================================

from datetime import datetime, timezone
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.enums import CaseStage, UserRole, JurisdictionLevel
from app.models.user import User
from app.schemas.case import CaseCreate, CaseRead, CaseDetail
from app.schemas.document import DocumentCreate
from app.schemas.workflow import AwardCreate, RRSchemeCreate
from app.repositories.case_repo import CaseRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.workflow_repo import WorkflowRepository
from app.repositories.user_repo import UserRepository
from app.services.stage_machine import validate_stage_transition
from app.services.jurisdiction import enforce_jurisdiction, check_user_jurisdiction


class CaseService:
    """
    Business service layer orchestrating the full statutory lifecycle of land acquisition cases.
    Enforces atomic transactions across state changes and audit logging.
    """

    @staticmethod
    def _compute_sla(db: Session, case: Case) -> Tuple[bool, int]:
        """Calculates days spent in current stage and whether statutory SLA is breached."""
        now = datetime.now(timezone.utc)
        entered_at = case.stage_entered_at
        if entered_at.tzinfo is None:
            entered_at = entered_at.replace(tzinfo=timezone.utc)
        delta_days = (now - entered_at).days

        config = WorkflowRepository.get_stage_duration_config(db, case.current_stage)
        expected = config.expected_days if config else 30
        is_overdue = delta_days > expected
        return is_overdue, delta_days

    @classmethod
    def to_case_read(cls, db: Session, case: Case) -> CaseRead:
        """Converts ORM Case to CaseRead DTO with dynamically computed statutory SLA status."""
        is_overdue, days = cls._compute_sla(db, case)
        data = {
            "id": case.id,
            "project_name": case.project_name,
            "requiring_body_user_id": case.requiring_body_user_id,
            "purpose_category": case.purpose_category,
            "justification": case.justification,
            "estimated_affected_families": case.estimated_affected_families,
            "district_id": case.district_id,
            "state_id": case.state_id,
            "current_stage": case.current_stage,
            "stage_entered_at": case.stage_entered_at,
            "created_at": case.created_at,
            "is_overdue": is_overdue,
            "days_in_stage": days,
        }
        return CaseRead(**data)

    @classmethod
    def to_case_detail(cls, db: Session, case: Case) -> CaseDetail:
        """Converts ORM Case to CaseDetail DTO with nested parcels and SLA status."""
        is_overdue, days = cls._compute_sla(db, case)
        total_area = sum(float(p.area_hectares) for p in case.parcels)
        data = {
            "id": case.id,
            "project_name": case.project_name,
            "requiring_body_user_id": case.requiring_body_user_id,
            "purpose_category": case.purpose_category,
            "justification": case.justification,
            "estimated_affected_families": case.estimated_affected_families,
            "district_id": case.district_id,
            "state_id": case.state_id,
            "current_stage": case.current_stage,
            "stage_entered_at": case.stage_entered_at,
            "created_at": case.created_at,
            "is_overdue": is_overdue,
            "days_in_stage": days,
            "parcels": case.parcels,
            "total_area_hectares": total_area
        }
        return CaseDetail(**data)

    @classmethod
    def create_case(cls, db: Session, user: User, case_in: CaseCreate) -> CaseDetail:
        """
        Creates a new acquisition proposal.
        Enforces requiring_body role, ABAC jurisdiction, and atomic audit logging.
        """
        if user.role != UserRole.REQUIRING_BODY.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only requiring body entities can submit land acquisition proposals."
            )

        enforce_jurisdiction(user, district_id=case_in.district_id, state_id=case_in.state_id)

        case_data = {
            "project_name": case_in.project_name,
            "requiring_body_user_id": user.id,
            "purpose_category": case_in.purpose_category.value,
            "justification": case_in.justification,
            "estimated_affected_families": case_in.estimated_affected_families,
            "district_id": case_in.district_id,
            "state_id": case_in.state_id,
            "current_stage": CaseStage.PROPOSAL_SUBMITTED.value
        }

        # Atomic transaction: Case Creation + Parcel Linking + Initial Audit Log
        try:
            case = CaseRepository.create_case(db, case_data, case_in.parcel_ids)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="proposal_submitted",
                remarks=f"Initial acquisition proposal submitted for {len(case_in.parcel_ids)} parcels."
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def get_case_by_id(cls, db: Session, case_id: int, user: User) -> CaseDetail:
        """
        Retrieves case details by ID.
        Enforces jurisdiction: returns 403 if case is outside user's jurisdiction.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        return cls.to_case_detail(db, case)

    @classmethod
    def list_cases(
        cls,
        db: Session,
        user: User,
        stage: Optional[str] = None,
        district_id: Optional[int] = None,
        state_id: Optional[int] = None,
        mine: bool = False
    ) -> List[CaseRead]:
        """
        Lists cases filtered by parameters, strictly scoped to caller's ABAC jurisdiction.
        """
        effective_district = district_id
        effective_state = state_id
        requiring_body_id = user.id if mine else None

        if user.jurisdiction_level == JurisdictionLevel.DISTRICT.value:
            effective_district = user.jurisdiction_id
        elif user.jurisdiction_level == JurisdictionLevel.STATE.value:
            effective_state = user.jurisdiction_id

        cases = CaseRepository.get_cases(
            db=db,
            stage=stage,
            district_id=effective_district,
            state_id=effective_state,
            requiring_body_user_id=requiring_body_id
        )
        return [cls.to_case_read(db, c) for c in cases]

    @classmethod
    def approve_case(cls, db: Session, case_id: int, user: User, remarks: Optional[str] = None) -> CaseDetail:
        """
        Approves case to advance to the next statutory review stage.
        Validates role authority, jurisdiction, and legal stage transition.
        Single database transaction for state change + audit log.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        # Determine target stage based on current stage and role
        current = case.current_stage
        target_stage: Optional[CaseStage] = None

        if current == CaseStage.PROPOSAL_SUBMITTED.value:
            if user.role != UserRole.DISTRICT_COLLECTOR.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only District Collector can approve proposals for district review.")
            target_stage = CaseStage.DISTRICT_REVIEW

        elif current == CaseStage.DISTRICT_REVIEW.value:
            if user.role != UserRole.DISTRICT_COLLECTOR.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only District Collector can approve district review to state review.")
            target_stage = CaseStage.STATE_REVIEW

        elif current == CaseStage.STATE_REVIEW.value:
            if user.role != UserRole.STATE_APPROVER.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only State Approver can approve proposals for SIA.")
            target_stage = CaseStage.SIA_IN_PROGRESS

        elif current == CaseStage.COMPENSATION_DISBURSED.value:
            target_stage = CaseStage.POSSESSION_TAKEN

        elif current == CaseStage.POSSESSION_TAKEN.value:
            target_stage = CaseStage.COMPLETED

        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stage '{current}' cannot be advanced via generic approve action. Use specific stage endpoint."
            )

        validate_stage_transition(current, target_stage.value)

        # Atomic state change + audit log commit
        try:
            now = datetime.now(timezone.utc)
            CaseRepository.update_case_stage(db, case_id=case.id, new_stage=target_stage.value, stage_entered_at=now)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action=f"approved_to_{target_stage.value}",
                remarks=remarks or f"Stage transitioned from {current} to {target_stage.value} by {user.role}."
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def reject_case(cls, db: Session, case_id: int, user: User, remarks: str) -> CaseDetail:
        """
        Rejects an acquisition proposal.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.REJECTED.value)

        try:
            now = datetime.now(timezone.utc)
            CaseRepository.update_case_stage(db, case_id=case.id, new_stage=CaseStage.REJECTED.value, stage_entered_at=now)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="rejected",
                remarks=remarks
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def request_clarification(cls, db: Session, case_id: int, user: User, remarks: str) -> CaseDetail:
        """
        Returns proposal to requiring body for clarification.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.RETURNED_FOR_CLARIFICATION.value)

        try:
            now = datetime.now(timezone.utc)
            CaseRepository.update_case_stage(
                db, case_id=case.id, new_stage=CaseStage.RETURNED_FOR_CLARIFICATION.value, stage_entered_at=now
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="returned_for_clarification",
                remarks=remarks
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def publish_notification(
        cls,
        db: Session,
        case_id: int,
        user: User,
        notification_number: Optional[str] = None,
        document_id: Optional[int] = None,
        remarks: Optional[str] = None
    ) -> CaseDetail:
        """
        Publishes preliminary notification and advances stage into objections window.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        # SIA must precede notification publication
        validate_stage_transition(case.current_stage, CaseStage.NOTIFICATION_PUBLISHED.value)

        try:
            now = datetime.now(timezone.utc)
            # Transition to notification published, then immediately open objections window
            CaseRepository.update_case_stage(
                db, case_id=case.id, new_stage=CaseStage.OBJECTIONS_WINDOW.value, stage_entered_at=now
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="notification_published",
                remarks=f"Notification {notification_number or 'published'} - Objections window opened. Remarks: {remarks or 'None'}"
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def declare_award(cls, db: Session, case_id: int, user: User, award_in: AwardCreate) -> CaseDetail:
        """
        Declares statutory compensation award and transitions case stage to award_declared.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.AWARD_DECLARED.value)

        award_data = {
            "case_id": case.id,
            "compensation_amount": award_in.compensation_amount,
            "award_document_id": award_in.award_document_id,
            "declared_by_user_id": user.id
        }

        try:
            now = datetime.now(timezone.utc)
            WorkflowRepository.create_award(db, award_data)
            CaseRepository.update_case_stage(
                db, case_id=case.id, new_stage=CaseStage.AWARD_DECLARED.value, stage_entered_at=now
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="award_declared",
                remarks=f"Statutory award declared: ₹{award_in.compensation_amount:,.2f}. Remarks: {award_in.remarks or 'None'}"
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def begin_rr(cls, db: Session, case_id: int, user: User, rr_in: RRSchemeCreate) -> CaseDetail:
        """
        Approves R&R scheme and advances case into rr_in_progress.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.RR_IN_PROGRESS.value)

        scheme_data = {
            "case_id": case.id,
            "scheme_document_id": rr_in.scheme_document_id,
            "development_plan_document_id": rr_in.development_plan_document_id,
            "created_by_user_id": user.id
        }

        try:
            now = datetime.now(timezone.utc)
            WorkflowRepository.create_rr_scheme(db, scheme_data)
            CaseRepository.update_case_stage(
                db, case_id=case.id, new_stage=CaseStage.RR_IN_PROGRESS.value, stage_entered_at=now
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="rr_in_progress",
                remarks=f"R&R Scheme initiated. Remarks: {rr_in.remarks or 'None'}"
            )
            db.commit()
            db.refresh(case)
        except Exception:
            db.rollback()
            raise

        return cls.to_case_detail(db, case)

    @classmethod
    def get_audit_logs(cls, db: Session, case_id: int, user: User) -> List[AuditLog]:
        """Fetches chronological audit trail for a case after enforcing jurisdiction."""
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        return AuditRepository.get_audit_logs_for_case(db, case_id)

    @classmethod
    def flag_audit_log(cls, db: Session, case_id: int, entry_id: int, user: User, remarks: Optional[str] = None) -> AuditLog:
        """
        Flags an existing audit log entry for supervisory review.
        The only allowed mutation on audit_log; leaves actor, action, remarks, timestamp intact.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        entry = AuditRepository.get_audit_entry_by_id(db, entry_id)
        if not entry or entry.case_id != case_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log entry not found for this case.")

        try:
            flagged_entry = AuditRepository.flag_audit_entry(db, entry_id=entry_id, flagged_by_user_id=user.id)
            db.commit()
            db.refresh(flagged_entry)
        except Exception:
            db.rollback()
            raise

        return flagged_entry

    @classmethod
    def get_documents(cls, db: Session, case_id: int, user: User, stage: Optional[str] = None) -> List[Document]:
        """Fetches statutory documents for a case after enforcing jurisdiction."""
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        return DocumentRepository.get_documents_by_case(db, case_id=case_id, stage=stage)

    @classmethod
    def add_document(cls, db: Session, case_id: int, user: User, doc_in: DocumentCreate) -> Document:
        """Attaches an official document to a case stage with audit trail logging."""
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        doc_data = {
            "case_id": case_id,
            "stage": doc_in.stage.value,
            "doc_type": doc_in.doc_type.value,
            "file_url": doc_in.file_url,
            "uploaded_by_user_id": user.id
        }

        try:
            doc = DocumentRepository.create_document(db, doc_data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="document_uploaded",
                remarks=f"Uploaded {doc_in.doc_type.value} document for {doc_in.stage.value} stage."
            )
            db.commit()
            db.refresh(doc)
        except Exception:
            db.rollback()
            raise

        return doc
