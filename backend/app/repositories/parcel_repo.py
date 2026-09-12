# ==============================================================================
# Layer: Repositories — Cadastral Parcels & Spatial Queries (app/repositories/parcel_repo.py)
# ALLOWED:
#   - Execute raw database queries for parcels, filter by district/case/khasra/bbox.
#   - Perform PostGIS ST_Intersects bounding box queries with SQLite fallback.
#   - Insert and update parcel records and link to cases.
# NOT ALLOWED:
#   - NO Shapely GeoJSON serialization here (that is a service/schema responsibility).
#   - NO role checks or jurisdiction authorization logic (belongs in services/parcel_service.py).
# ==============================================================================

import uuid
from typing import List, Optional, Tuple, Union
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from geoalchemy2.elements import WKTElement

from app.models.parcel import Parcel


class ParcelRepository:
    """Raw database access queries for Cadastral Parcels and PostGIS geometries."""

    @staticmethod
    def get_by_id(db: Session, parcel_id: Union[uuid.UUID, str]) -> Optional[Parcel]:
        """Fetch a single parcel by UUID or string ID."""
        if isinstance(parcel_id, str):
            try:
                parcel_id = uuid.UUID(parcel_id)
            except ValueError:
                # If non-UUID string or legacy format, check string representation
                stmt = select(Parcel).where(func.cast(Parcel.id, str) == parcel_id)
                return db.scalars(stmt).first()
        return db.get(Parcel, parcel_id)

    @staticmethod
    def get_by_ids(db: Session, parcel_ids: List[Union[uuid.UUID, str, int]]) -> List[Parcel]:
        """Fetch multiple parcels by a list of IDs (UUIDs, string UUIDs, or ints)."""
        if not parcel_ids:
            return []
        
        parsed_uuids = []
        string_ids = []
        for pid in parcel_ids:
            if isinstance(pid, uuid.UUID):
                parsed_uuids.append(pid)
            elif isinstance(pid, str):
                try:
                    parsed_uuids.append(uuid.UUID(pid))
                except ValueError:
                    string_ids.append(pid)
            else:
                string_ids.append(str(pid))

        clauses = []
        if parsed_uuids:
            clauses.append(Parcel.id.in_(parsed_uuids))
        if string_ids:
            clauses.append(func.cast(Parcel.id, str).in_(string_ids))
            clauses.append(Parcel.khasra_number.in_(string_ids))

        if not clauses:
            return []

        stmt = select(Parcel).where(or_(*clauses))
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_khasra(db: Session, khasra_number: str, district: str) -> Optional[Parcel]:
        """Lookup an exact Khasra parcel within a specified district."""
        stmt = select(Parcel).where(
            func.lower(Parcel.khasra_number) == khasra_number.strip().lower(),
            func.lower(Parcel.district) == district.strip().lower()
        )
        return db.scalars(stmt).first()

    @staticmethod
    def list_by_district(
        db: Session,
        district: str,
        bbox: Optional[Tuple[float, float, float, float]] = None
    ) -> List[Parcel]:
        """
        List parcels in a district, optionally filtered by viewport bounding box
        (min_lng, min_lat, max_lng, max_lat) using PostGIS ST_Intersects with SQLite fallback.
        """
        stmt = select(Parcel).where(func.lower(Parcel.district) == district.strip().lower())

        if bbox:
            min_lng, min_lat, max_lng, max_lat = bbox
            is_sqlite = db.bind and db.bind.dialect.name == "sqlite"
            if is_sqlite:
                stmt = stmt.where(
                    Parcel.centroid_lng.between(min_lng, max_lng),
                    Parcel.centroid_lat.between(min_lat, max_lat)
                )
            else:
                try:
                    envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
                    stmt = stmt.where(func.ST_Intersects(Parcel.geometry, envelope))
                except Exception:
                    stmt = stmt.where(
                        Parcel.centroid_lng.between(min_lng, max_lng),
                        Parcel.centroid_lat.between(min_lat, max_lat)
                    )

        stmt = stmt.order_by(Parcel.khasra_number)
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_all(
        db: Session,
        bbox: Optional[Tuple[float, float, float, float]] = None
    ) -> List[Parcel]:
        """Fetch all parcels across districts (for Policy Viewer), optionally bbox-filtered."""
        stmt = select(Parcel)
        if bbox:
            min_lng, min_lat, max_lng, max_lat = bbox
            is_sqlite = db.bind and db.bind.dialect.name == "sqlite"
            if is_sqlite:
                stmt = stmt.where(
                    Parcel.centroid_lng.between(min_lng, max_lng),
                    Parcel.centroid_lat.between(min_lat, max_lat)
                )
            else:
                try:
                    envelope = func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
                    stmt = stmt.where(func.ST_Intersects(Parcel.geometry, envelope))
                except Exception:
                    stmt = stmt.where(
                        Parcel.centroid_lng.between(min_lng, max_lng),
                        Parcel.centroid_lat.between(min_lat, max_lat)
                    )
        stmt = stmt.order_by(Parcel.khasra_number)
        return list(db.scalars(stmt).all())

    @staticmethod
    def list_by_case(db: Session, case_id: int) -> List[Parcel]:
        """Fetch all cadastral parcels linked to an acquisition case."""
        stmt = select(Parcel).where(Parcel.case_id == case_id).order_by(Parcel.khasra_number)
        return list(db.scalars(stmt).all())

    @staticmethod
    def link_to_case(
        db: Session,
        parcel_id: Union[uuid.UUID, str],
        case_id: Optional[int]
    ) -> Optional[Parcel]:
        """Assign or unassign a parcel to/from an acquisition case."""
        parcel = ParcelRepository.get_by_id(db, parcel_id)
        if not parcel:
            return None
        parcel.case_id = case_id
        db.flush()
        return parcel

    @staticmethod
    def search_khasra(
        db: Session,
        query: str,
        district: Optional[str] = None
    ) -> List[Parcel]:
        """
        Partial case-insensitive Khasra search within an optional district scope.
        Used for search-and-fly-to map autocomplete.
        """
        stmt = select(Parcel).where(Parcel.khasra_number.ilike(f"%{query.strip()}%"))
        if district:
            stmt = stmt.where(func.lower(Parcel.district) == district.strip().lower())
        stmt = stmt.order_by(Parcel.khasra_number).limit(20)
        return list(db.scalars(stmt).all())

    @staticmethod
    def update_encroachment_status(
        db: Session,
        parcel_id: Union[uuid.UUID, str],
        new_status: str
    ) -> Optional[Parcel]:
        """Update parcel statutory encroachment status."""
        parcel = ParcelRepository.get_by_id(db, parcel_id)
        if not parcel:
            return None
        parcel.encroachment_status = new_status
        db.flush()
        return parcel

    @staticmethod
    def create_parcel(db: Session, parcel_data: dict) -> Parcel:
        """Create a new cadastral parcel with WKT or binary PostGIS geometry."""
        geom = parcel_data["geometry"]
        if isinstance(geom, str):
            geom = WKTElement(geom, srid=4326)

        parcel = Parcel(
            id=parcel_data.get("id", uuid.uuid4()),
            khasra_number=parcel_data["khasra_number"],
            village=parcel_data["village"],
            tehsil=parcel_data["tehsil"],
            district=parcel_data["district"],
            state=parcel_data["state"],
            revenue_sheet_no=parcel_data["revenue_sheet_no"],
            geometry=geom,
            centroid_lat=parcel_data["centroid_lat"],
            centroid_lng=parcel_data["centroid_lng"],
            area_sqm=parcel_data["area_sqm"],
            encroachment_status=parcel_data.get("encroachment_status", "clear"),
            dispute_status=parcel_data.get("dispute_status", "clear"),
            dispute_source=parcel_data.get("dispute_source"),
            dispute_notes=parcel_data.get("dispute_notes"),
            ownership_type=parcel_data.get("ownership_type", "private"),
            case_id=parcel_data.get("case_id")
        )
        db.add(parcel)
        db.flush()
        return parcel
