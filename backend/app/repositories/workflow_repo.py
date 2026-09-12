# ==============================================================================
# Layer: Repositories — Workflow Entities (app/repositories/workflow_repo.py)
# ALLOWED:
#   - Execute raw queries for SIA verdicts, objections, statutory awards, R&R schemes,
#     affected families, and family milestone logs.
#   - Append-only log creation for family_status_log (NO update or delete methods).
# NOT ALLOWED:
#   - NO workflow state checks or stage progression rules here.
#   - NEVER evaluate user permissions or jurisdiction in this repository.
# ==============================================================================

from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func

from app.models.workflow import (
    SIAVerdict,
    Objection,
    Award,
    RRScheme,
    AffectedFamily,
    FamilyStatusLog,
    StageDurationConfig,
)


class WorkflowRepository:
    """Raw database queries for stage-specific entities."""

    # --- SIA Verdicts ---
    @staticmethod
    def create_or_update_sia_verdict(db: Session, data: dict) -> SIAVerdict:
        verdict = db.scalars(
            select(SIAVerdict).where(SIAVerdict.case_id == data["case_id"])
        ).first()

        if not verdict:
            verdict = SIAVerdict(
                case_id=data["case_id"],
                agree_public_purpose=data["agree_public_purpose"],
                min_land_confirmed=data["min_land_confirmed"],
                alternate_location_feasible=data["alternate_location_feasible"],
                independent_family_estimate=data["independent_family_estimate"],
                cost_rating=data["cost_rating"],
                recommendation=data["recommendation"],
                report_document_id=data.get("report_document_id"),
                hearing_date=data.get("hearing_date"),
                hearing_minutes_document_id=data.get("hearing_minutes_document_id"),
                submitted_by_user_id=data["submitted_by_user_id"],
                submitted_at=datetime.now(timezone.utc)
            )
            db.add(verdict)
        else:
            verdict.agree_public_purpose = data["agree_public_purpose"]
            verdict.min_land_confirmed = data["min_land_confirmed"]
            verdict.alternate_location_feasible = data["alternate_location_feasible"]
            verdict.independent_family_estimate = data["independent_family_estimate"]
            verdict.cost_rating = data["cost_rating"]
            verdict.recommendation = data["recommendation"]
            if "report_document_id" in data:
                verdict.report_document_id = data["report_document_id"]
            if "hearing_date" in data:
                verdict.hearing_date = data["hearing_date"]
            if "hearing_minutes_document_id" in data:
                verdict.hearing_minutes_document_id = data["hearing_minutes_document_id"]
            verdict.submitted_by_user_id = data["submitted_by_user_id"]
            verdict.submitted_at = datetime.now(timezone.utc)

        db.flush()
        return verdict

    @staticmethod
    def get_sia_verdict_by_case_id(db: Session, case_id: int) -> Optional[SIAVerdict]:
        stmt = (
            select(SIAVerdict)
            .options(
                selectinload(SIAVerdict.report_document),
                selectinload(SIAVerdict.hearing_minutes_document),
                selectinload(SIAVerdict.submitted_by)
            )
            .where(SIAVerdict.case_id == case_id)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def update_hearing_details(
        db: Session,
        case_id: int,
        hearing_date: date,
        minutes_document_id: int
    ) -> Optional[SIAVerdict]:
        verdict = db.scalars(
            select(SIAVerdict).where(SIAVerdict.case_id == case_id)
        ).first()
        if not verdict:
            return None
        verdict.hearing_date = hearing_date
        verdict.hearing_minutes_document_id = minutes_document_id
        db.flush()
        return verdict

    # --- Objections ---
    @staticmethod
    def create_objection(db: Session, data: dict) -> Objection:
        objection = Objection(
            case_id=data["case_id"],
            description=data["description"],
            document_id=data.get("document_id"),
            logged_by_user_id=data["logged_by_user_id"],
            logged_at=datetime.now(timezone.utc)
        )
        db.add(objection)
        db.flush()
        return objection

    @staticmethod
    def get_objections_by_case(db: Session, case_id: int) -> List[Objection]:
        stmt = (
            select(Objection)
            .options(selectinload(Objection.document), selectinload(Objection.logged_by))
            .where(Objection.case_id == case_id)
            .order_by(Objection.logged_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_objection_count_by_case(db: Session, case_id: int) -> int:
        stmt = select(func.count(Objection.id)).where(Objection.case_id == case_id)
        return db.scalar(stmt) or 0

    # --- Statutory Award ---
    @staticmethod
    def create_award(db: Session, data: dict) -> Award:
        award = Award(
            case_id=data["case_id"],
            compensation_amount=data["compensation_amount"],
            award_document_id=data.get("award_document_id"),
            declared_by_user_id=data["declared_by_user_id"],
            declared_at=datetime.now(timezone.utc)
        )
        db.add(award)
        db.flush()
        return award

    @staticmethod
    def get_award_by_case_id(db: Session, case_id: int) -> Optional[Award]:
        stmt = (
            select(Award)
            .options(selectinload(Award.award_document), selectinload(Award.declared_by))
            .where(Award.case_id == case_id)
        )
        return db.scalars(stmt).first()

    # --- R&R Scheme ---
    @staticmethod
    def create_rr_scheme(db: Session, data: dict) -> RRScheme:
        scheme = RRScheme(
            case_id=data["case_id"],
            scheme_document_id=data.get("scheme_document_id"),
            development_plan_document_id=data.get("development_plan_document_id"),
            created_by_user_id=data["created_by_user_id"],
            created_at=datetime.now(timezone.utc)
        )
        db.add(scheme)
        db.flush()
        return scheme

    @staticmethod
    def get_rr_scheme_by_case_id(db: Session, case_id: int) -> Optional[RRScheme]:
        stmt = (
            select(RRScheme)
            .options(
                selectinload(RRScheme.scheme_document),
                selectinload(RRScheme.development_plan_document),
                selectinload(RRScheme.created_by)
            )
            .where(RRScheme.case_id == case_id)
        )
        return db.scalars(stmt).first()

    # --- Affected Families & Family Status Logs (Append-Only) ---
    @staticmethod
    def create_affected_family(db: Session, data: dict) -> AffectedFamily:
        now = datetime.now(timezone.utc)
        family = AffectedFamily(
            case_id=data["case_id"],
            family_head_name=data["family_head_name"],
            current_address=data["current_address"],
            land_reference=data["land_reference"],
            rr_status=data.get("rr_status", "scheme_communicated"),
            updated_at=now
        )
        db.add(family)
        db.flush()
        return family

    @staticmethod
    def get_affected_families_by_case(db: Session, case_id: int) -> List[AffectedFamily]:
        stmt = (
            select(AffectedFamily)
            .options(selectinload(AffectedFamily.status_logs))
            .where(AffectedFamily.case_id == case_id)
            .order_by(AffectedFamily.id)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_affected_family_by_id(db: Session, family_id: int) -> Optional[AffectedFamily]:
        stmt = (
            select(AffectedFamily)
            .options(selectinload(AffectedFamily.status_logs))
            .where(AffectedFamily.id == family_id)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def update_family_rr_status(
        db: Session,
        family_id: int,
        new_status: str
    ) -> Optional[AffectedFamily]:
        family = db.get(AffectedFamily, family_id)
        if not family:
            return None
        family.rr_status = new_status
        family.updated_at = datetime.now(timezone.utc)
        db.flush()
        return family

    @staticmethod
    def create_family_status_log(db: Session, data: dict) -> FamilyStatusLog:
        """Append-only insert for family status milestone log."""
        log = FamilyStatusLog(
            family_id=data["family_id"],
            status=data["status"],
            document_id=data.get("document_id"),
            remarks=data.get("remarks"),
            updated_by_user_id=data["updated_by_user_id"],
            updated_at=datetime.now(timezone.utc)
        )
        db.add(log)
        db.flush()
        return log

    @staticmethod
    def get_family_status_logs(db: Session, family_id: int) -> List[FamilyStatusLog]:
        stmt = (
            select(FamilyStatusLog)
            .options(selectinload(FamilyStatusLog.updated_by), selectinload(FamilyStatusLog.document))
            .where(FamilyStatusLog.family_id == family_id)
            .order_by(FamilyStatusLog.updated_at.desc())
        )
        return list(db.scalars(stmt).all())

    # --- Stage SLA Duration Config ---
    @staticmethod
    def get_stage_duration_config(db: Session, stage: str) -> Optional[StageDurationConfig]:
        return db.get(StageDurationConfig, stage)

    @staticmethod
    def get_all_stage_durations(db: Session) -> List[StageDurationConfig]:
        stmt = select(StageDurationConfig)
        return list(db.scalars(stmt).all())

    @staticmethod
    def upsert_stage_duration(db: Session, stage: str, expected_days: int) -> StageDurationConfig:
        config = db.get(StageDurationConfig, stage)
        if not config:
            config = StageDurationConfig(stage=stage, expected_days=expected_days)
            db.add(config)
        else:
            config.expected_days = expected_days
        db.flush()
        return config
