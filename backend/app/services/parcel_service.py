# ==============================================================================
# Layer: Services — Cadastral Parcels & GIS (app/services/parcel_service.py)
# ALLOWED:
#   - Convert PostGIS geometry to standard RFC 7946 GeoJSON using GeoAlchemy2/Shapely.
#   - Enforce ABAC jurisdiction filtering over cadastral parcels.
# NOT ALLOWED:
#   - NO raw SQL execution (delegate to repositories/parcel_repo.py).
#   - Do NOT hand-roll geometry parsing without Shapely / GeoAlchemy2 to_shape.
# ==============================================================================

from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping

from app.models.parcel import Parcel
from app.models.user import User
from app.models.enums import JurisdictionLevel
from app.repositories.parcel_repo import ParcelRepository
from app.schemas.parcel import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
)
from app.services.jurisdiction import enforce_jurisdiction


class ParcelService:
    """
    GIS Parcel service converting PostGIS WKB geometry into standard RFC 7946 GeoJSON.
    Uses geoalchemy2.shape.to_shape and shapely.geometry.mapping.
    """

    @staticmethod
    def _parcel_to_feature(parcel: Parcel) -> GeoJSONFeature:
        """Converts an ORM Parcel entity to an RFC 7946 GeoJSON Feature."""
        shape = to_shape(parcel.geometry)
        geom_dict = mapping(shape)

        return GeoJSONFeature(
            type="Feature",
            id=parcel.id,
            geometry=GeoJSONGeometry(
                type=geom_dict["type"],
                coordinates=geom_dict["coordinates"]
            ),
            properties={
                "khasra_number": parcel.khasra_number,
                "district_id": parcel.district_id,
                "area_hectares": float(parcel.area_hectares),
                "status": parcel.status,
                "current_case_id": parcel.current_case_id
            }
        )

    @classmethod
    def get_parcels_geojson(
        cls,
        db: Session,
        user: User,
        district_id: Optional[int] = None
    ) -> GeoJSONFeatureCollection:
        """
        Fetches parcels and serializes them into a GeoJSON FeatureCollection.
        Enforces that district-scoped callers cannot access parcels from outside their district.
        """
        target_district = district_id

        # Scope restriction based on user ABAC jurisdiction
        if user.jurisdiction_level == JurisdictionLevel.DISTRICT.value:
            if district_id and district_id != user.jurisdiction_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: You only have access to district {user.jurisdiction_id}."
                )
            target_district = user.jurisdiction_id

        if target_district:
            parcels = ParcelRepository.get_parcels_by_district(db, target_district)
        else:
            parcels = ParcelRepository.get_all_parcels(db)

        features = [cls._parcel_to_feature(p) for p in parcels]
        return GeoJSONFeatureCollection(
            type="FeatureCollection",
            features=features
        )

    @classmethod
    def get_parcel_by_id(cls, db: Session, parcel_id: int, user: User) -> GeoJSONFeature:
        """Fetches a single parcel by ID and validates jurisdiction before returning."""
        parcel = ParcelRepository.get_parcel_by_id(db, parcel_id)
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parcel #{parcel_id} not found."
            )

        enforce_jurisdiction(user, district_id=parcel.district_id)
        return cls._parcel_to_feature(parcel)
