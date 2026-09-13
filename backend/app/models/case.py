# ==============================================================================
# Layer: SQLAlchemy Models — Acquisition Cases & Associations (app/models/case.py)
# ALLOWED:
#   - Define relational mapping and associations for the core acquisition case entity.
#   - Define the many-to-many case_parcels join table.
# NOT ALLOWED:
#   - NEVER evaluate legal stage transitions here (that belongs in services/stage_machine.py).
#   - NO audit log generation in model hooks (auditing must be explicitly orchestrated in services/).
# ==============================================================================

from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CaseStage, PurposeCategory, LocationSensitivity

if TYPE_CHECKING:
    from app.models.user import User, District, State
    from app.models.parcel import Parcel
    from app.models.audit import AuditLog
    from app.models.document import Document
    from app.models.workflow import SIAVerdict, Objection, Award, RRScheme, AffectedFamily
    from app.models.document_signature import DocumentSignature
    from app.models.dispute_referral import DisputeReferral
    from app.models.land_verification import LandVerificationRecord

# Many-to-many join table between Cases and Parcels
case_parcels = Table(
    "case_parcels",
    Base.metadata,
    Column("case_id", Integer, ForeignKey("cases.id", ondelete="CASCADE"), primary_key=True),
    Column("parcel_id", Integer, ForeignKey("parcels.id", ondelete="CASCADE"), primary_key=True)
)


class Case(Base):
    """
    The central workflow entity representing a government land acquisition proposal.
    Tracks project lifecycle from proposal submission through R&R completion.
    """
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requiring_body_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    purpose_category: Mapped[str] = mapped_column(String(50), nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_affected_families: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    has_dispute_warning: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    location_sensitivity: Mapped[str] = mapped_column(
        String(50), default=LocationSensitivity.STANDARD.value, nullable=False
    )
    district_id: Mapped[int] = mapped_column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    state_id: Mapped[int] = mapped_column(Integer, ForeignKey("states.id"), nullable=False)
    current_stage: Mapped[str] = mapped_column(
        String(50), nullable=False, default=CaseStage.PROPOSAL_SUBMITTED.value, index=True
    )
    stage_entered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    requiring_body: Mapped["User"] = relationship("User", foreign_keys=[requiring_body_user_id])
    district: Mapped["District"] = relationship("District", foreign_keys=[district_id])
    state: Mapped["State"] = relationship("State", foreign_keys=[state_id])

    parcels: Mapped[List["Parcel"]] = relationship("Parcel", back_populates="case")
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="case", cascade="all, delete-orphan", order_by="AuditLog.created_at.desc()"
    )
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    signatures: Mapped[List["DocumentSignature"]] = relationship(
        "DocumentSignature", back_populates="case", cascade="all, delete-orphan", order_by="DocumentSignature.signed_at.desc()"
    )
    sia_verdict: Mapped[Optional["SIAVerdict"]] = relationship(
        "SIAVerdict", back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    objections: Mapped[List["Objection"]] = relationship("Objection", back_populates="case", cascade="all, delete-orphan")
    award: Mapped[Optional["Award"]] = relationship("Award", back_populates="case", uselist=False, cascade="all, delete-orphan")
    rr_scheme: Mapped[Optional["RRScheme"]] = relationship(
        "RRScheme", back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    affected_families: Mapped[List["AffectedFamily"]] = relationship(
        "AffectedFamily", back_populates="case", cascade="all, delete-orphan"
    )
    dispute_referrals: Mapped[List["DisputeReferral"]] = relationship(
        "DisputeReferral", back_populates="case", cascade="all, delete-orphan", order_by="DisputeReferral.referred_at.desc()"
    )
    land_verifications: Mapped[List["LandVerificationRecord"]] = relationship(
        "LandVerificationRecord", back_populates="case", cascade="all, delete-orphan", order_by="LandVerificationRecord.submitted_at.desc()"
    )
