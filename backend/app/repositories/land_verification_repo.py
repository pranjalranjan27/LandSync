# ==============================================================================
# Layer: Repositories — Land Verification (app/repositories/land_verification_repo.py)
# ALLOWED:
#   - Execute database queries for LandVerificationRecord using SQLAlchemy 2.0 select syntax.
# NOT ALLOWED:
#   - NO route handling or business permission checks here.
# ==============================================================================

import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.land_verification import LandVerificationRecord
from app.models.case import Case
from app.models.parcel import Parcel
from app.models.enums import LandVerificationStatus


class LandVerificationRepository:
    """Database repository for Section 4 Land Verification records."""

    @staticmethod
    def create(db: Session, record_data: Dict[str, Any]) -> LandVerificationRecord:
        record = LandVerificationRecord(**record_data)
        db.add(record)
        db.flush()
        return record

    @staticmethod
    def get_by_id(db: Session, record_id: Any) -> Optional[LandVerificationRecord]:
        if isinstance(record_id, str):
            try:
                record_id = uuid.UUID(record_id)
            except ValueError:
                return None
        return db.get(LandVerificationRecord, record_id)

    @staticmethod
    def get_latest_for_case(db: Session, case_id: int) -> Optional[LandVerificationRecord]:
        stmt = (
            select(LandVerificationRecord)
            .where(LandVerificationRecord.case_id == case_id)
            .order_by(desc(LandVerificationRecord.submitted_at))
            .limit(1)
        )
        return db.execute(stmt).scalars().first()

    @staticmethod
    def list_for_case(db: Session, case_id: int) -> List[LandVerificationRecord]:
        stmt = (
            select(LandVerificationRecord)
            .where(LandVerificationRecord.case_id == case_id)
            .order_by(desc(LandVerificationRecord.submitted_at))
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def list_pending_for_tehsil(
        db: Session,
        tehsil: Optional[str] = None,
        status: str = LandVerificationStatus.SUBMITTED.value
    ) -> List[LandVerificationRecord]:
        stmt = (
            select(LandVerificationRecord)
            .where(LandVerificationRecord.status == status)
            .order_by(desc(LandVerificationRecord.submitted_at))
        )
        records = list(db.execute(stmt).scalars().all())
        if not tehsil:
            return records

        # Filter by tehsil of linked case parcels
        matched = []
        clean_tehsil = tehsil.strip().lower()
        for r in records:
            case = db.get(Case, r.case_id)
            if not case:
                continue
            case_tehsils = {p.tehsil.strip().lower() for p in case.parcels if p.tehsil}
            if clean_tehsil in case_tehsils:
                matched.append(r)
        return matched

    @staticmethod
    def update(db: Session, record: LandVerificationRecord, **kwargs) -> LandVerificationRecord:
        for k, v in kwargs.items():
            setattr(record, k, v)
        db.flush()
        return record
