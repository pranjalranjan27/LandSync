# ==============================================================================
# Layer: Repositories — Cadastral Parcels & Spatial Queries (app/repositories/parcel_repo.py)
# ALLOWED:
#   - Execute raw database queries for parcels, filter by district/case/khasra.
#   - Insert and update parcel records and link to cases.
# NOT ALLOWED:
#   - NO Shapely GeoJSON serialization here (that is a service/schema responsibility).
#   - NO role checks or jurisdiction authorization logic.
# ==============================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from geoalchemy2.elements import WKTElement

from app.models.parcel import Parcel
from app.models.case import case_parcels


class ParcelRepository:
    """Raw database access queries for Cadastral Parcels."""

    @staticmethod
    def get_parcel_by_id(db: Session, parcel_id: int) -> Optional[Parcel]:
        return db.get(Parcel, parcel_id)

    @staticmethod
    def get_parcel_by_khasra(db: Session, khasra_number: str) -> Optional[Parcel]:
        stmt = select(Parcel).where(Parcel.khasra_number == khasra_number.strip())
        return db.scalars(stmt).first()

    @staticmethod
    def get_parcels_by_district(db: Session, district_id: int) -> List[Parcel]:
        stmt = select(Parcel).where(Parcel.district_id == district_id).order_by(Parcel.id)
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_parcels_by_case_id(db: Session, case_id: int) -> List[Parcel]:
        stmt = (
            select(Parcel)
            .join(case_parcels, Parcel.id == case_parcels.c.parcel_id)
            .where(case_parcels.c.case_id == case_id)
            .order_by(Parcel.id)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_parcels_by_ids(db: Session, parcel_ids: List[int]) -> List[Parcel]:
        if not parcel_ids:
            return []
        stmt = select(Parcel).where(Parcel.id.in_(parcel_ids))
        return list(db.scalars(stmt).all())

    @staticmethod
    def create_parcel(db: Session, parcel_data: dict) -> Parcel:
        # Accepts geometry either as WKT string, WKTElement, or raw Geometry
        geom = parcel_data["geometry"]
        if isinstance(geom, str):
            geom = WKTElement(geom, srid=4326)

        parcel = Parcel(
            khasra_number=parcel_data["khasra_number"],
            district_id=parcel_data["district_id"],
            geometry=geom,
            area_hectares=parcel_data["area_hectares"],
            status=parcel_data.get("status", "not_started"),
            current_case_id=parcel_data.get("current_case_id")
        )
        db.add(parcel)
        db.flush()
        return parcel

    @staticmethod
    def update_parcel_status(
        db: Session,
        parcel_id: int,
        status: str,
        current_case_id: Optional[int] = None
    ) -> Optional[Parcel]:
        parcel = db.get(Parcel, parcel_id)
        if not parcel:
            return None
        parcel.status = status
        if current_case_id is not None:
            parcel.current_case_id = current_case_id
        db.flush()
        return parcel

    @staticmethod
    def get_all_parcels(db: Session) -> List[Parcel]:
        stmt = select(Parcel).order_by(Parcel.id)
        return list(db.scalars(stmt).all())
