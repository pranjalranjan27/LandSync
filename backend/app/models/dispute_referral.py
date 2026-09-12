# ==============================================================================
# Layer: SQLAlchemy Models — LARR Authority Dispute Referrals (app/models/dispute_referral.py)
# ALLOWED:
#   - Define relational mapping and associations for compensation dispute referrals
#     under Chapter VIII of the RFCTLARR Act, 2013.
# NOT ALLOWED:
#   - NEVER evaluate workflow transitions or legal possession gates here (services layer).
# ==============================================================================

import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DisputeReferralStatus

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.user import User


class DisputeReferral(Base):
    """
    Statutory compensation dispute referral to the Land Acquisition,
    Rehabilitation and Resettlement (LARR) Authority under Chapter VIII of the RFCTLARR Act, 2013.
    Operates as a parallel track alongside compensation_disbursed.
    """
    __tablename__ = "dispute_referrals"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    referred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    referred_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    larr_case_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    hearing_dates: Mapped[Optional[list]] = mapped_column(JSON, default=list, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        default=DisputeReferralStatus.REFERRED.value,
        nullable=False,
        index=True
    )
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    high_court_appeal_outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="dispute_referrals")
    referred_by: Mapped["User"] = relationship("User", foreign_keys=[referred_by_user_id])
