# ==============================================================================
# Layer: SQLAlchemy Models — Cadastral Parcels & GIS (app/models/parcel.py)
# ALLOWED:
#   - Define relational and geospatial columns for land parcels using GeoAlchemy2.
#   - Specify SRID 4326 Polygon geometry for spatial queries.
#   - Store denormalized centroid coordinates for high-performance bounding box and search queries.
# NOT ALLOWED:
#   - NO GIS calculation or spatial clipping business logic in this model.
#   - Do not convert to GeoJSON here (that belongs in schemas and services).
# ==============================================================================

import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, UniqueConstraint, Index, Uuid, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.db.base import Base
from app.models.enums import EncroachmentStatus, OwnershipType, DisputeStatus

if TYPE_CHECKING:
    from app.models.case import Case


class Parcel(Base):
    """
    Cadastral parcel containing spatial PostGIS polygon geometry, denormalized centroid,
    and statutory encroachment and ownership classifications under the RFCTLARR Act 2013.
    """
    __tablename__ = "parcels"
    __table_args__ = (
        UniqueConstraint("village", "khasra_number", name="uq_parcels_village_khasra"),
        Index("idx_parcels_district", "district"),
        Index("idx_parcels_geometry", "geometry", postgresql_using="gist"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    khasra_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    village: Mapped[str] = mapped_column(String(150), nullable=False)
    tehsil: Mapped[str] = mapped_column(String(150), nullable=False)
    district: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(150), nullable=False)
    revenue_sheet_no: Mapped[str] = mapped_column(String(50), nullable=False)
    geometry = mapped_column(Geometry(geometry_type="POLYGON", srid=4326, spatial_index=False), nullable=False)
    centroid_lat: Mapped[float] = mapped_column(Float, nullable=False)
    centroid_lng: Mapped[float] = mapped_column(Float, nullable=False)
    area_sqm: Mapped[float] = mapped_column(Float, nullable=False)
    encroachment_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=EncroachmentStatus.CLEAR.value,
        index=True
    )
    # Real-world integration: NGDRS (prohibition registry) & NJDG (pending civil/revenue litigation)
    dispute_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=DisputeStatus.CLEAR.value,
        index=True
    )
    dispute_source: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    dispute_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    ownership_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=OwnershipType.PRIVATE.value
    )
    case_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("cases.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="parcels")

    @property
    def area_hectares(self) -> float:
        return round(self.area_sqm / 10000.0, 4)

    @property
    def status(self) -> str:
        return self.encroachment_status
