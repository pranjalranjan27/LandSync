# ==============================================================================
# Layer: SQLAlchemy Models — Statutory Audit Trail (app/models/audit.py)
# DESIGN CONSTRAINT & ALLOWED:
#   - Append-only immutable audit log table.
#   - Every state transition or legal action on a case MUST write exactly one row here
#     within the same database transaction as the state change.
#   - The ONLY mutation allowed on an existing row is the 'flag for review' action, which
#     modifies strictly 'flagged' and 'flagged_by_user_id'.
# NOT ALLOWED:
#   - NO generic UPDATE or DELETE repository functions may exist for this table.
#   - NEVER alter actor_user_id, action, remarks, or created_at once written.
# ==============================================================================

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.user import User


class AuditLog(Base):
    """
    Append-only legal audit log tracking every administrative action and stage transition.
    Immutability is guaranteed by architectural design: no update or delete operations are exposed.
    """
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Flag for supervisory review (the only permissible mutation on an existing row)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    flagged_by_user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    case: Mapped["Case"] = relationship("Case", back_populates="audit_logs")
    actor: Mapped["User"] = relationship("User", foreign_keys=[actor_user_id])
    flagged_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[flagged_by_user_id])
