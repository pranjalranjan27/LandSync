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
from typing import List, Optional, Tuple, Union
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

import uuid
from app.models.case import Case
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.enums import CaseStage, UserRole, JurisdictionLevel, LocationSensitivity, SignatureActionType, DisputeReferralStatus, LandVerificationStatus
from app.models.user import User
from app.models.dispute_referral import DisputeReferral
from app.models.land_verification import LandVerificationRecord
from app.schemas.case import CaseCreate, CaseRead, CaseDetail
from app.schemas.document import DocumentCreate
from app.schemas.workflow import AwardCreate, RRSchemeCreate
from app.schemas.signature import SignatureResponse
from app.schemas.dispute_referral import DisputeReferralCreate, DisputeReferralUpdate, DisputeReferralRead
from app.schemas.land_verification import LandVerificationRead
from app.repositories.case_repo import CaseRepository
from app.repositories.audit_repo import AuditRepository
from app.repositories.document_repo import DocumentRepository
from app.repositories.workflow_repo import WorkflowRepository
from app.repositories.user_repo import UserRepository
from app.repositories.dispute_referral_repo import DisputeReferralRepository
from app.repositories.land_verification_repo import LandVerificationRepository
from app.services.stage_machine import validate_stage_transition
from app.services.jurisdiction import enforce_jurisdiction, check_user_jurisdiction
from app.services.land_verification_service import LandVerificationService


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
        """Converts ORM Case to CaseRead DTO with dynamically computed statutory SLA status and dispute flag."""
        is_overdue, days = cls._compute_sla(db, case)

        has_active_dispute = False
        active_dispute_read = None
        if getattr(case, "dispute_referrals", None):
            for r in case.dispute_referrals:
                if r.status != DisputeReferralStatus.CLOSED.value:
                    has_active_dispute = True
                    active_dispute_read = DisputeReferralRead.model_validate(r)
                    break
        elif hasattr(case, "id") and case.id is not None:
            active_ref = DisputeReferralRepository.get_active_referral_for_case(db, case.id)
            if active_ref:
                has_active_dispute = True
                active_dispute_read = DisputeReferralRead.model_validate(active_ref)

        data = {
            "id": case.id,
            "project_name": case.project_name,
            "requiring_body_user_id": case.requiring_body_user_id,
            "purpose_category": case.purpose_category,
            "justification": case.justification,
            "estimated_affected_families": case.estimated_affected_families,
            "has_dispute_warning": getattr(case, "has_dispute_warning", False),
            "location_sensitivity": getattr(case, "location_sensitivity", LocationSensitivity.STANDARD.value),
            "district_id": case.district_id,
            "state_id": case.state_id,
            "current_stage": case.current_stage,
            "stage_entered_at": case.stage_entered_at,
            "created_at": case.created_at,
            "is_overdue": is_overdue,
            "days_in_stage": days,
            "has_active_dispute": has_active_dispute,
            "active_dispute": active_dispute_read
        }
        return CaseRead(**data)

    @classmethod
    def to_case_detail(cls, db: Session, case: Case) -> CaseDetail:
        """Converts ORM Case to CaseDetail DTO with nested parcels, signatures, dispute referrals, and SLA status."""
        is_overdue, days = cls._compute_sla(db, case)
        total_area = sum(float(p.area_hectares) for p in case.parcels)

        signatures_data = []
        if getattr(case, "signatures", None):
            for s in case.signatures:
                signatures_data.append(
                    SignatureResponse(
                        id=s.id,
                        case_id=s.case_id,
                        document_id=s.document_id,
                        signer_user_id=s.signer_user_id,
                        signer_name=s.signer.name if getattr(s, "signer", None) else None,
                        signer_role=s.signer_role,
                        signer_jurisdiction=s.signer_jurisdiction,
                        action_type=s.action_type,
                        payload_hash=s.payload_hash,
                        signed_at=s.signed_at
                    )
                )

        has_active_dispute = False
        active_dispute_read = None
        referrals_data = []
        if getattr(case, "dispute_referrals", None):
            for r in case.dispute_referrals:
                r_read = DisputeReferralRead.model_validate(r)
                referrals_data.append(r_read)
                if r.status != DisputeReferralStatus.CLOSED.value and not has_active_dispute:
                    has_active_dispute = True
                    active_dispute_read = r_read
        elif hasattr(case, "id") and case.id is not None:
            refs = DisputeReferralRepository.get_referrals_for_case(db, case.id)
            for r in refs:
                r_read = DisputeReferralRead.model_validate(r)
                referrals_data.append(r_read)
                if r.status != DisputeReferralStatus.CLOSED.value and not has_active_dispute:
                    has_active_dispute = True
                    active_dispute_read = r_read

        verification_read = None
        latest_ver = LandVerificationRepository.get_latest_for_case(db, case.id)
        if latest_ver:
            verification_read = LandVerificationService._to_read(db, latest_ver)

        data = {
            "id": case.id,
            "project_name": case.project_name,
            "requiring_body_user_id": case.requiring_body_user_id,
            "purpose_category": case.purpose_category,
            "justification": case.justification,
            "estimated_affected_families": case.estimated_affected_families,
            "has_dispute_warning": getattr(case, "has_dispute_warning", False),
            "location_sensitivity": getattr(case, "location_sensitivity", LocationSensitivity.STANDARD.value),
            "district_id": case.district_id,
            "state_id": case.state_id,
            "current_stage": case.current_stage,
            "stage_entered_at": case.stage_entered_at,
            "created_at": case.created_at,
            "is_overdue": is_overdue,
            "days_in_stage": days,
            "has_active_dispute": has_active_dispute,
            "active_dispute": active_dispute_read,
            "dispute_referrals": referrals_data,
            "land_verification": verification_read,
            "parcels": case.parcels,
            "signatures": signatures_data,
            "total_area_hectares": total_area
        }
        return CaseDetail(**data)

    @classmethod
    def create_case(cls, db: Session, user: User, case_in: CaseCreate) -> CaseDetail:
        """
        Creates a new acquisition proposal.
        Enforces requiring_body role, ABAC jurisdiction, Pre-Submission GIS Dispute Gate,
        and atomic audit logging.
        """
        if user.role != UserRole.REQUIRING_BODY.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only requiring body entities can submit land acquisition proposals."
            )

        enforce_jurisdiction(user, district_id=case_in.district_id, state_id=case_in.state_id)

        # Pre-Submission GIS Dispute Gate (NJDG / NGDRS integration)
        from app.services.parcel_service import ParcelService
        validation = ParcelService.validate_parcel_selection(db, case_in.parcel_ids)
        if validation.has_prohibited:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Proposal creation blocked: One or more selected parcels are prohibited from acquisition.",
                    "has_prohibited": True,
                    "prohibited_parcels": [p.model_dump() for p in validation.prohibited_parcels],
                    "all_flagged": [p.model_dump() for p in validation.flagged_parcels]
                }
            )

        case_data = {
            "project_name": case_in.project_name,
            "requiring_body_user_id": user.id,
            "purpose_category": case_in.purpose_category.value,
            "justification": case_in.justification,
            "estimated_affected_families": case_in.estimated_affected_families,
            "has_dispute_warning": validation.has_litigation,
            "location_sensitivity": case_in.location_sensitivity.value if hasattr(case_in.location_sensitivity, "value") else str(case_in.location_sensitivity),
            "district_id": case_in.district_id,
            "state_id": case_in.state_id,
            "current_stage": CaseStage.PROPOSAL_SUBMITTED.value
        }

        # Atomic transaction: Case Creation + Parcel Linking + Initial Audit Log
        try:
            case = CaseRepository.create_case(db, case_data, case_in.parcel_ids)
            remarks = f"Initial acquisition proposal submitted for {len(case_in.parcel_ids)} parcels."
            if validation.has_litigation:
                remarks += f" WARNING: Contains {len(validation.litigation_parcels)} parcel(s) under active litigation."

            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=user.id,
                action="proposal_submitted",
                remarks=remarks
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
        elif user.jurisdiction_level in (JurisdictionLevel.VILLAGE.value, JurisdictionLevel.TEHSIL.value) and user.jurisdiction_id:
            effective_district = user.jurisdiction_id

        cases = CaseRepository.get_cases(
            db=db,
            stage=stage,
            district_id=effective_district,
            state_id=effective_state,
            requiring_body_user_id=requiring_body_id
        )

        # Apply finer-grained village/tehsil filtering for Patwari/Tehsildar
        if user.jurisdiction_level == JurisdictionLevel.VILLAGE.value and user.jurisdiction_value:
            assigned = [v.strip().lower() for v in user.jurisdiction_value.split(",")]
            filtered = []
            for c in cases:
                c_villages = [p.village.strip().lower() for p in c.parcels if p.village]
                if any(v in assigned for v in c_villages):
                    filtered.append(c)
            cases = filtered
        elif user.jurisdiction_level == JurisdictionLevel.TEHSIL.value and user.jurisdiction_value:
            assigned_tehsil = user.jurisdiction_value.strip().lower()
            filtered = []
            for c in cases:
                c_tehsils = [p.tehsil.strip().lower() for p in c.parcels if p.tehsil]
                if assigned_tehsil in c_tehsils:
                    filtered.append(c)
            cases = filtered

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
            # Statutory Legal Gate: Under RFCTLARR Act 2013, physical possession CANNOT proceed
            # while a compensation dispute referral is active (status != closed).
            active_ref = DisputeReferralRepository.get_active_referral_for_case(db, case.id)
            if active_ref:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Possession blocked: Case #{case.id} has an active compensation dispute referred to "
                        f"LARR Authority (Referral ID: {active_ref.id}, Status: '{active_ref.status}'). "
                        "Statutory possession cannot proceed until the dispute is resolved and closed by the Authority."
                    )
                )
            target_stage = CaseStage.POSSESSION_TAKEN

        elif current == CaseStage.POSSESSION_TAKEN.value:
            target_stage = CaseStage.COMPLETED

        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stage '{current}' cannot be advanced via generic approve action. Use specific stage endpoint."
            )

        if target_stage == CaseStage.STATE_REVIEW:
            # Statutory Legal Gate: Section 4 ground verification by Patwari/Lekhpal
            # MUST be certified by Tehsildar before proceeding to State Review.
            latest_ver = LandVerificationRepository.get_latest_for_case(db, case.id)
            if not latest_ver or latest_ver.status != LandVerificationStatus.CERTIFIED.value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Land verification not yet certified by Tehsildar"
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
    def reject_case(
        cls,
        db: Session,
        case_id: int,
        user: User,
        remarks: str,
        evidence_document_id: Optional[int] = None
    ) -> CaseDetail:
        """
        Rejects an acquisition proposal with mandatory digital signature and justification.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.REJECTED.value)

        try:
            now = datetime.now(timezone.utc)
            CaseRepository.update_case_stage(db, case_id=case.id, new_stage=CaseStage.REJECTED.value, stage_entered_at=now)

            # Atomic Digital Signature (Section 3 IT Act 2000)
            from app.services.signature_service import SignatureService
            SignatureService.sign_action(
                db=db,
                case_id=case.id,
                action_type=SignatureActionType.REJECTED,
                user=user,
                document_id=evidence_document_id
            )

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
        Publishes statutory preliminary notification with digital signature and advances stage into objections window.
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

            # Atomic Digital Signature (Section 3 IT Act 2000)
            from app.services.signature_service import SignatureService
            SignatureService.sign_action(
                db=db,
                case_id=case.id,
                action_type=SignatureActionType.NOTIFICATION_PUBLISHED,
                user=user,
                document_id=document_id
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
        Declares statutory compensation award with digital signature and transitions case stage to award_declared.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)
        validate_stage_transition(case.current_stage, CaseStage.AWARD_DECLARED.value)

        award_doc_id = award_in.award_document_id or award_in.evidence_document_id

        award_data = {
            "case_id": case.id,
            "compensation_amount": award_in.compensation_amount,
            "award_document_id": award_doc_id,
            "declared_by_user_id": user.id
        }

        try:
            now = datetime.now(timezone.utc)
            WorkflowRepository.create_award(db, award_data)
            CaseRepository.update_case_stage(
                db, case_id=case.id, new_stage=CaseStage.AWARD_DECLARED.value, stage_entered_at=now
            )

            # Atomic Digital Signature (Section 3 IT Act 2000)
            from app.services.signature_service import SignatureService
            SignatureService.sign_action(
                db=db,
                case_id=case.id,
                action_type=SignatureActionType.AWARD_DECLARED,
                user=user,
                document_id=award_doc_id
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

    @classmethod
    def list_cases_for_larr_authority(cls, db: Session, user: User) -> List[CaseDetail]:
        """
        Retrieves cases visible to LARR Authority.

        CRITICAL ARCHITECTURAL DISTINCTION:
        LARR Authority (Chapter VIII of RFCTLARR Act, 2013) does NOT use jurisdiction-scoped browsing.
        Unlike the Collector/State roles (district/state scope) and unlike Independent SIA Expert /
        R&R Monitoring Committee (national scope), LARR Authority gets ZERO visibility into cases
        until a case has specifically been referred to it under Section 64 with an active
        (status != 'closed') DisputeReferral record.
        This is a join/filter on DisputeReferral, NOT an ABAC jurisdiction check.
        Do NOT replace, simplify, or refactor this into the same jurisdiction-scope pattern!
        """
        if user.role != UserRole.LARR_AUTHORITY.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted: Only LARR Authority presiding officers can access referred dispute cases."
            )

        cases = DisputeReferralRepository.get_cases_with_active_referral(db)
        return [cls.to_case_detail(db, c) for c in cases]

    @classmethod
    def refer_to_larr_authority(
        cls,
        db: Session,
        case_id: int,
        referring_user: User,
        reason: str
    ) -> DisputeReferral:
        """
        Refers a compensation dispute to the LARR Authority under Section 64 of RFCTLARR Act 2013.
        - Callable only by District Collector or State Approver within their statutory jurisdiction.
        - Only permitted when case.current_stage == 'compensation_disbursed'.
        - Does NOT change case.current_stage (dispute is a parallel track).
        - Atomically creates DisputeReferral and writes an audit log entry.
        """
        if referring_user.role not in [UserRole.DISTRICT_COLLECTOR.value, UserRole.STATE_APPROVER.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only District Collector or State Approver can refer compensation disputes to LARR Authority."
            )

        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(referring_user, district_id=case.district_id, state_id=case.state_id)

        if case.current_stage != CaseStage.COMPENSATION_DISBURSED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Cannot refer to LARR Authority: Case #{case_id} is in '{case.current_stage}' stage. "
                    f"Dispute referral is only permissible in '{CaseStage.COMPENSATION_DISBURSED.value}' stage."
                )
            )

        # Check if an active dispute already exists
        existing_dispute = DisputeReferralRepository.get_active_referral_for_case(db, case_id)
        if existing_dispute:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Case #{case_id} already has an active dispute referral (ID: {existing_dispute.id}, Status: '{existing_dispute.status}')."
            )

        referral_data = {
            "case_id": case.id,
            "referred_by_user_id": referring_user.id,
            "reason": reason,
            "status": DisputeReferralStatus.REFERRED.value
        }

        try:
            referral = DisputeReferralRepository.create_referral(db, referral_data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=referring_user.id,
                action="dispute_referred_to_larr",
                remarks=f"Compensation dispute referred to LARR Authority under Section 64. Grounds: {reason}"
            )
            db.commit()
            db.refresh(referral)
        except Exception:
            db.rollback()
            raise

        return referral

    @classmethod
    def update_larr_referral(
        cls,
        db: Session,
        referral_id: Union[uuid.UUID, str],
        user: User,
        update_in: DisputeReferralUpdate
    ) -> DisputeReferral:
        """
        Updates proceedings, hearing dates, or resolution outcome for a dispute referral.
        - Callable only by LARR Authority.
        - Setting status to 'closed' unblocks the case progression to possession_taken.
        - Atomically writes an audit log entry.
        """
        if user.role != UserRole.LARR_AUTHORITY.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only LARR Authority presiding officers can update dispute referral proceedings."
            )

        referral = DisputeReferralRepository.get_referral_by_id(db, referral_id)
        if not referral:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute referral record not found.")

        update_data = update_in.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"] is not None:
            if hasattr(update_data["status"], "value"):
                update_data["status"] = update_data["status"].value
            if update_data["status"] == DisputeReferralStatus.CLOSED.value:
                referral.resolved_at = datetime.now(timezone.utc)

        try:
            updated = DisputeReferralRepository.update_referral(db, referral, update_data)
            status_desc = update_data.get("status", referral.status)
            remarks = f"LARR Authority updated dispute referral proceedings. Status: {status_desc}."
            if "outcome" in update_data and update_data["outcome"]:
                remarks += f" Decision/Order: {update_data['outcome']}."
            if "larr_case_number" in update_data and update_data["larr_case_number"]:
                remarks += f" Case No: {update_data['larr_case_number']}."

            action_name = "larr_dispute_resolved" if status_desc == DisputeReferralStatus.CLOSED.value else "larr_referral_updated"
            AuditRepository.create_audit_entry(
                db=db,
                case_id=referral.case_id,
                actor_user_id=user.id,
                action=action_name,
                remarks=remarks
            )
            db.commit()
            db.refresh(updated)
        except Exception:
            db.rollback()
            raise

        return updated
