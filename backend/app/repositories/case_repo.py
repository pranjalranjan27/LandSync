# ==============================================================================
# Layer: Repositories — Cases & Association Queries (app/repositories/case_repo.py)
# ALLOWED:
#   - Execute raw SQLAlchemy queries for Case entities and many-to-many parcel associations.
#   - Filter cases by stage, district, state, and creator.
# NOT ALLOWED:
#   - NO stage transition validation rules (forbidden here, belongs in services/stage_machine.py).
#   - NO jurisdiction checks or role enforcement.
#   - NO implicit audit log insertions (audit logging must be coordinated by the service layer).
# ==============================================================================

from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func

from app.models.case import Case, case_parcels
from app.models.parcel import Parcel


class CaseRepository:
    """Raw database access queries for Acquisition Cases."""

    @staticmethod
    def get_case_by_id(db: Session, case_id: int) -> Optional[Case]:
        stmt = (
            select(Case)
            .options(
                selectinload(Case.parcels),
                selectinload(Case.signatures),
                selectinload(Case.requiring_body),
                selectinload(Case.district),
                selectinload(Case.state),
                selectinload(Case.documents),
                selectinload(Case.sia_verdict),
                selectinload(Case.objections),
                selectinload(Case.award),
                selectinload(Case.rr_scheme),
                selectinload(Case.affected_families)
            )
            .where(Case.id == case_id)
        )
        return db.scalars(stmt).first()

    @staticmethod
    def get_cases(
        db: Session,
        stage: Optional[str] = None,
        district_id: Optional[int] = None,
        state_id: Optional[int] = None,
        requiring_body_user_id: Optional[int] = None
    ) -> List[Case]:
        stmt = select(Case).options(selectinload(Case.parcels), selectinload(Case.signatures))

        if stage:
            stmt = stmt.where(Case.current_stage == stage)
        if district_id:
            stmt = stmt.where(Case.district_id == district_id)
        if state_id:
            stmt = stmt.where(Case.state_id == state_id)
        if requiring_body_user_id:
            stmt = stmt.where(Case.requiring_body_user_id == requiring_body_user_id)

        stmt = stmt.order_by(Case.created_at.desc())
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_case(db: Session, case_data: dict, parcel_ids: List[Any]) -> Case:
        now = datetime.now(timezone.utc)
        case = Case(
            project_name=case_data["project_name"],
            requiring_body_user_id=case_data["requiring_body_user_id"],
            purpose_category=case_data["purpose_category"],
            justification=case_data["justification"],
            estimated_affected_families=case_data.get("estimated_affected_families", 0),
            has_dispute_warning=case_data.get("has_dispute_warning", False),
            location_sensitivity=case_data.get("location_sensitivity", "standard"),
            district_id=case_data["district_id"],
            state_id=case_data["state_id"],
            current_stage=case_data.get("current_stage", "proposal_submitted"),
            stage_entered_at=now,
            created_at=now
        )
        db.add(case)
        db.flush()

        # Link requested parcels
        if parcel_ids:
            from app.repositories.parcel_repo import ParcelRepository
            parcels = ParcelRepository.get_by_ids(db, parcel_ids)
            for p in parcels:
                if p not in case.parcels:
                    case.parcels.append(p)
                p.case_id = case.id
            db.flush()

        return case

    @staticmethod
    def update_case_stage(
        db: Session,
        case_id: int,
        new_stage: str,
        stage_entered_at: Optional[datetime] = None
    ) -> Optional[Case]:
        case = db.get(Case, case_id)
        if not case:
            return None
        case.current_stage = new_stage
        case.stage_entered_at = stage_entered_at or datetime.now(timezone.utc)
        db.flush()
        return case

    @staticmethod
    def attach_parcels_to_case(db: Session, case_id: int, parcel_ids: List[int]) -> None:
        case = db.get(Case, case_id)
        if not case or not parcel_ids:
            return
        parcels = list(db.scalars(select(Parcel).where(Parcel.id.in_(parcel_ids))).all())
        for p in parcels:
            if p not in case.parcels:
                case.parcels.append(p)
                p.status = "under_process"
                p.current_case_id = case.id
        db.flush()

    @staticmethod
    def get_case_count_by_scope(
        db: Session,
        scope: str,
        scope_id: Optional[int] = None
    ) -> dict:
        stmt = select(Case.current_stage, func.count(Case.id)).group_by(Case.current_stage)
        if scope == "district" and scope_id:
            stmt = stmt.where(Case.district_id == scope_id)
        elif scope == "state" and scope_id:
            stmt = stmt.where(Case.state_id == scope_id)

        rows = db.execute(stmt).all()
        return {stage: count for stage, count in rows}
