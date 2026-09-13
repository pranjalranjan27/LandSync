# ==============================================================================
# Layer: SQLAlchemy Models — Land Verification (app/models/land_verification.py)
# ALLOWED:
#   - Define relational mapping for statutory land verification records under Section 4.
#   - Two-step ground verification: Patwari/Lekhpal reports facts -> Tehsildar certifies.
# NOT ALLOWED:
#   - NO query logic or route definitions in this model file.
# ==============================================================================

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import LandVerificationStatus

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.user import User


class LandVerificationRecord(Base):
    """
    Statutory Land Verification Record under Section 4 of RFCTLARR Act 2013.
    Replaces generic field inspection with the actual Indian revenue administration hierarchy:
    1. Patwari/Lekhpal verifies Khasra ownership against village revenue records,
       inspects physical boundaries, inventories standing assets (crops, trees, structures, wells),
       and records statutory notice service.
    2. Tehsildar exercises quasi-judicial revenue authority to either certify the record
       (unblocking progression to State Review) or return it for correction with mandatory notes.
    """
    __tablename__ = "land_verifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parcel_ids: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    khasra_ownership_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ownership_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    boundary_verification_notes: Mapped[str] = mapped_column(Text, nullable=False)
    asset_inventory: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    notice_served_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notice_served_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_by_officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=LandVerificationStatus.SUBMITTED.value,
        index=True
    )
    certified_by_tehsildar_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    certified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tehsildar_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="land_verifications")
    submitted_by_officer: Mapped["User"] = relationship("User", foreign_keys=[submitted_by_officer_id])
    certified_by_tehsildar: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[certified_by_tehsildar_id]
    )
