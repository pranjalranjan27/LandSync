# ==============================================================================
# Layer: Declarative Base (app/db/base.py)
# ALLOWED:
#   - Define the central SQLAlchemy 2.0 DeclarativeBase for all ORM models.
#   - Aggregate model metadata so that Alembic migrations and database introspection
#     can discover all tables through Base.metadata.
# NOT ALLOWED:
#   - Never implement query functions or business workflows in this file.
# ==============================================================================

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.0 ORM models in LandSync."""
    pass


# Import all models here so that Base.metadata is fully populated when imported by Alembic or test runners.
# Note: imported at bottom to avoid circular imports.
from app.models.user import State, District, User  # noqa: E402, F401
from app.models.parcel import Parcel  # noqa: E402, F401
from app.models.case import Case, case_parcels  # noqa: E402, F401
from app.models.audit import AuditLog  # noqa: E402, F401
from app.models.document import Document  # noqa: E402, F401
from app.models.workflow import (  # noqa: E402, F401
    SIAVerdict,
    Objection,
    Award,
    RRScheme,
    AffectedFamily,
    FamilyStatusLog,
    StageDurationConfig,
)
