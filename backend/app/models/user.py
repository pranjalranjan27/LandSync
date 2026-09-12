# ==============================================================================
# Layer: SQLAlchemy Models — Users & Geography (app/models/user.py)
# ALLOWED:
#   - Define relational mapping (tables, columns, foreign keys, relationships) for
#     Users, Districts, and States using SQLAlchemy 2.0 syntax (Mapped, mapped_column).
# NOT ALLOWED:
#   - NO business logic, NO validation of stage rules, NO password hashing logic here.
#   - NEVER query the database or invoke service methods from this model file.
# ==============================================================================

from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole, JurisdictionLevel


class State(Base):
    """Administrative State entity."""
    __tablename__ = "states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    districts: Mapped[List["District"]] = relationship("District", back_populates="state", cascade="all, delete-orphan")


class District(Base):
    """Administrative District entity under a State."""
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    state_id: Mapped[int] = mapped_column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False)

    state: Mapped["State"] = relationship("State", back_populates="districts")


class User(Base):
    """
    User entity with RBAC role and ABAC jurisdiction scope.
    jurisdiction_level: district | state | national
    jurisdiction_id: null only when jurisdiction_level == national
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    jurisdiction_level: Mapped[str] = mapped_column(String(20), nullable=False)
    jurisdiction_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
