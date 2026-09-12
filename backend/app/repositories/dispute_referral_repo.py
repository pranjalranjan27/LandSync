# ==============================================================================
# Layer: Repositories — LARR Dispute Referrals (app/repositories/dispute_referral_repo.py)
# ALLOWED:
#   - Execute ORM query construction for dispute referral records and referral-based case retrieval.
# NOT ALLOWED:
#   - NO stage machine or jurisdiction checking here (belongs in services/).
# ==============================================================================

import uuid
from typing import List, Optional, Union
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.dispute_referral import DisputeReferral
from app.models.enums import DisputeReferralStatus
from app.models.case import Case


class DisputeReferralRepository:
    """Data access repository for LARR Authority compensation dispute referrals."""

    @staticmethod
    def create_referral(db: Session, referral_data: dict) -> DisputeReferral:
        referral = DisputeReferral(**referral_data)
        db.add(referral)
        db.flush()
        return referral

    @staticmethod
    def get_referral_by_id(db: Session, referral_id: Union[uuid.UUID, str]) -> Optional[DisputeReferral]:
        if isinstance(referral_id, str):
            try:
                referral_id = uuid.UUID(referral_id)
            except ValueError:
                return None
        return db.get(DisputeReferral, referral_id)

    @staticmethod
    def get_active_referral_for_case(db: Session, case_id: int) -> Optional[DisputeReferral]:
        """Returns active referral for case (status != closed) if any."""
        stmt = (
            select(DisputeReferral)
            .where(
                DisputeReferral.case_id == case_id,
                DisputeReferral.status != DisputeReferralStatus.CLOSED.value
            )
            .order_by(DisputeReferral.referred_at.desc())
        )
        return db.scalars(stmt).first()

    @staticmethod
    def get_referrals_for_case(db: Session, case_id: int) -> List[DisputeReferral]:
        stmt = (
            select(DisputeReferral)
            .where(DisputeReferral.case_id == case_id)
            .order_by(DisputeReferral.referred_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def update_referral(db: Session, referral: DisputeReferral, update_data: dict) -> DisputeReferral:
        for key, value in update_data.items():
            if hasattr(referral, key) and value is not None:
                setattr(referral, key, value)
        db.flush()
        return referral

    @staticmethod
    def get_cases_with_active_referral(db: Session) -> List[Case]:
        """
        Retrieves all cases that have at least one active (status != closed) dispute referral.
        This powers referral-based visibility for LARR Authority, deliberately distinct
        from ABAC jurisdiction filtering.
        """
        stmt = (
            select(Case)
            .join(DisputeReferral, Case.id == DisputeReferral.case_id)
            .where(DisputeReferral.status != DisputeReferralStatus.CLOSED.value)
            .options(
                selectinload(Case.parcels),
                selectinload(Case.dispute_referrals),
                selectinload(Case.signatures)
            )
            .distinct()
            .order_by(Case.id.desc())
        )
        return list(db.scalars(stmt).all())
