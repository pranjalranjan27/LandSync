# ==============================================================================
# Layer: SQLAlchemy Models — Cadastral Parcels & GIS (app/models/parcel.py)
# ALLOWED:
#   - Define relational and geospatial columns for land parcels using GeoAlchemy2.
#   - Specify SRID 4326 Polygon geometry for spatial queries.
# NOT ALLOWED:
#   - NO GIS calculation or spatial clipping business logic in this model.
#   - Do not convert to GeoJSON here (that belongs in schemas and services).
# ==============================================================================

from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal
from sqlalchemy import String, Integer, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.db.base import Base
from app.models.enums import ParcelStatus

if TYPE_CHECKING:
    from app.models.user import District
    from app.models.case import Case


class Parcel(Base):
    """
    Cadastral parcel containing spatial polygon geometry and status.
    Uses PostGIS Geometry(POLYGON, 4326) via GeoAlchemy2.
    """
    __tablename__ = "parcels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    khasra_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district_id: Mapped[int] = mapped_column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    geometry = mapped_column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)
    area_hectares: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default=ParcelStatus.NOT_STARTED.value)
    current_case_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True
    )

    district: Mapped["District"] = relationship("District", back_populates="parcels")
    cases: Mapped[List["Case"]] = relationship("Case", secondary="case_parcels", back_populates="parcels")
