# ==============================================================================
# Layer: SQLAlchemy Models — Statutory Documents (app/models/document.py)
# ALLOWED:
#   - Define schema for uploaded official evidence files associated with specific stages.
# NOT ALLOWED:
#   - Do not perform disk I/O, file hashing, or multipart streaming in this model.
#   - File storage orchestration belongs in services/.
# ==============================================================================

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.case import Case
    from app.models.user import User


class Document(Base):
    """
    Official statutory document record attached to a case stage.
    Points to file storage via file_url.
    """
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    case: Mapped["Case"] = relationship("Case", back_populates="documents")
    uploaded_by: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by_user_id])
