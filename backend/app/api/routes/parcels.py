# ==============================================================================
# Layer: API Routes — Cadastral Parcels & GIS (app/api/routes/parcels.py)
# ALLOWED:
#   - Parse spatial parcel queries, invoke ParcelService, and return RFC 7946 GeoJSON.
# NOT ALLOWED:
#   - NEVER import repository functions or execute direct DB queries here.
#   - NO manual GeoJSON geometry parsing in route handlers.
# ==============================================================================

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user, require_jurisdiction_match
from app.models.user import User
from app.schemas.parcel import GeoJSONFeature, GeoJSONFeatureCollection
from app.services.parcel_service import ParcelService

router = APIRouter(prefix="/parcels", tags=["Cadastral Parcels (GIS)"])


@router.get("", response_model=GeoJSONFeatureCollection, status_code=status.HTTP_200_OK)
def get_parcels(
    district_id: Optional[int] = Query(None, description="Filter parcels by district ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve land parcels serialized as an RFC 7946 GeoJSON FeatureCollection.
    Automatically restricts output based on caller's ABAC jurisdiction.
    """
    return ParcelService.get_parcels_geojson(
        db=db,
        user=current_user,
        district_id=district_id
    )


@router.get(
    "/{id}",
    response_model=GeoJSONFeature,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("parcel"))]
)
def get_parcel(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single cadastral parcel by ID with PostGIS polygon geometry in GeoJSON format.
    Enforces that caller has jurisdiction over the parcel's district.
    """
    return ParcelService.get_parcel_by_id(
        db=db,
        parcel_id=id,
        user=current_user
    )
