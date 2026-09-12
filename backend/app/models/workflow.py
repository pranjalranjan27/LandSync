# ==============================================================================
# Layer: SQLAlchemy Models — Specialized Workflow Entities (app/models/workflow.py)
# ALLOWED:
#   - Define relational mapping for stage-specific entities: SIA verdicts, hearings,
#     objections, awards, R&R schemes, affected families, and family status logs.
#   - Define static statutory duration configuration for overdue SLA calculations.
# NOT ALLOWED:
#   - NO workflow state machine logic or transition validation here.
#   - Family status updates must be orchestrated in services/ with append-only logging.
# ==============================================================================

from datetime import datetime, date, timezone
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Numeric, Text, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.user import User
    from app.models.document import Document


class SIAVerdict(Base):
    """
    Social Impact Assessment (SIA) expert verdict.
    Strict 1:1 relationship with an acquisition Case.
    """
    __tablename__ = "sia_verdicts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    agree_public_purpose: Mapped[bool] = mapped_column(Boolean, nullable=False)
    min_land_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    alternate_location_feasible: Mapped[bool] = mapped_column(Boolean, nullable=False)
    independent_family_estimate: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_rating: Mapped[str] = mapped_column(String(20), nullable=False)
    recommendation: Mapped[str] = mapped_column(String(50), nullable=False)
    report_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    hearing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    hearing_minutes_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    submitted_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="sia_verdict")
    submitted_by: Mapped["User"] = relationship("User", foreign_keys=[submitted_by_user_id])
    report_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[report_document_id])
    hearing_minutes_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[hearing_minutes_document_id])


class Objection(Base):
    """Objection filed by land owners or stakeholders during the statutory window."""
    __tablename__ = "objections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    logged_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="objections")
    logged_by: Mapped["User"] = relationship("User", foreign_keys=[logged_by_user_id])
    document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[document_id])


class Award(Base):
    """
    Statutory Award declaration under the Land Acquisition Act.
    Strict 1:1 relationship with an acquisition Case.
    """
    __tablename__ = "awards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    compensation_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    award_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    declared_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    declared_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="award")
    declared_by: Mapped["User"] = relationship("User", foreign_keys=[declared_by_user_id])
    award_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[award_document_id])


class RRScheme(Base):
    """
    Rehabilitation & Resettlement (R&R) statutory master scheme.
    Strict 1:1 relationship with an acquisition Case.
    """
    __tablename__ = "rr_schemes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    scheme_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    development_plan_document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    created_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="rr_scheme")
    created_by: Mapped["User"] = relationship("User", foreign_keys=[created_by_user_id])
    scheme_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[scheme_document_id])
    development_plan_document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[development_plan_document_id])


class AffectedFamily(Base):
    """Project-affected family unit tracked through resettlement milestones."""
    __tablename__ = "affected_families"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    family_head_name: Mapped[str] = mapped_column(String(150), nullable=False)
    current_address: Mapped[str] = mapped_column(Text, nullable=False)
    land_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    rr_status: Mapped[str] = mapped_column(String(50), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="affected_families")
    status_logs: Mapped[List["FamilyStatusLog"]] = relationship(
        "FamilyStatusLog", back_populates="family", cascade="all, delete-orphan", order_by="FamilyStatusLog.updated_at.desc()"
    )


class FamilyStatusLog(Base):
    """
    Append-only milestone audit log for an individual affected family.
    No updates or deletes permitted.
    """
    __tablename__ = "family_status_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    family_id: Mapped[int] = mapped_column(Integer, ForeignKey("affected_families.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("documents.id"), nullable=True)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    family: Mapped["AffectedFamily"] = relationship("AffectedFamily", back_populates="status_logs")
    updated_by: Mapped["User"] = relationship("User", foreign_keys=[updated_by_user_id])
    document: Mapped[Optional["Document"]] = relationship("Document", foreign_keys=[document_id])


class StageDurationConfig(Base):
    """
    Static reference table defining statutory SLA durations (in days) per workflow stage.
    Used by service queries to compute case overdue status dynamically.
    """
    __tablename__ = "stage_duration_config"

    stage: Mapped[str] = mapped_column(String(50), primary_key=True)
    expected_days: Mapped[int] = mapped_column(Integer, nullable=False)
