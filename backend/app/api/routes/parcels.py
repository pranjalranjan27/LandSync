# ==============================================================================
# Layer: API Routes — Cadastral Parcels & GIS (app/api/routes/parcels.py)
# ALLOWED:
#   - Parse spatial parcel queries, parse request bodies, invoke ParcelService.
#   - Return RFC 7946 GeoJSON and search payload schemas.
# NOT ALLOWED:
#   - NEVER import repository functions or execute direct DB queries here.
#   - NO jurisdiction filtering in route handlers (delegated to ParcelService).
# ==============================================================================

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.parcel import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    ParcelSearchItem,
    ParcelLinkCaseRequest,
    ParcelEncroachmentUpdateRequest,
    DisputeValidationResult,
    ParcelValidateSelectionRequest,
)
from app.services.parcel_service import ParcelService

router = APIRouter(tags=["Cadastral Parcels (GIS)"])


@router.post(
    "/validate-selection",
    response_model=DisputeValidationResult,
    status_code=status.HTTP_200_OK,
    summary="Validate parcel selection for disputes prior to proposal submission"
)
def validate_parcel_selection(
    payload: ParcelValidateSelectionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates selected cadastral parcel IDs against litigation and statutory prohibition status.
    Called by Requiring Body during Form-1 proposal drafting.
    """
    return ParcelService.validate_parcel_selection(
        db=db,
        parcel_ids=payload.parcel_ids
    )


@router.get(
    "",
    response_model=GeoJSONFeatureCollection,
    status_code=status.HTTP_200_OK,
    summary="List cadastral parcels as GeoJSON FeatureCollection"
)
def list_parcels(
    district: Optional[str] = Query(None, description="District name (required unless Policy Viewer)"),
    bbox: Optional[str] = Query(None, description="Optional bounding box 'minLng,minLat,maxLng,maxLat'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve land parcels serialized as an RFC 7946 GeoJSON FeatureCollection.
    Server-side ABAC jurisdiction scoping is enforced inside ParcelService.
    """
    return ParcelService.list_parcels_geojson(
        db=db,
        user=current_user,
        district=district,
        bbox_str=bbox
    )


@router.get(
    "/search",
    response_model=List[ParcelSearchItem],
    status_code=status.HTTP_200_OK,
    summary="Search parcels by Khasra number"
)
def search_parcels(
    khasra_number: str = Query(..., min_length=1, description="Khasra number query"),
    district: Optional[str] = Query(None, description="District filter"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fast search autocomplete returning matching parcel centroids for map fly-to.
    """
    return ParcelService.search_khasra(
        db=db,
        user=current_user,
        query=khasra_number,
        district=district
    )


@router.get(
    "/{parcel_id}",
    response_model=GeoJSONFeature,
    status_code=status.HTTP_200_OK,
    summary="Retrieve single cadastral parcel GeoJSON Feature"
)
def get_parcel(
    parcel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve a single cadastral parcel by UUID with full properties (area, centroid, sheet no).
    """
    return ParcelService.get_parcel_by_id(
        db=db,
        parcel_id=parcel_id,
        user=current_user
    )


@router.post(
    "/{parcel_id}/link-case",
    response_model=GeoJSONFeature,
    status_code=status.HTTP_200_OK,
    summary="Link parcel to an acquisition case"
)
def link_parcel_to_case(
    parcel_id: str,
    payload: ParcelLinkCaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Links a parcel to an acquisition project.
    Permitted roles: Requiring Body, District Collector.
    Appends an immutable audit log record.
    """
    return ParcelService.link_parcel_to_case(
        db=db,
        parcel_id=parcel_id,
        case_id=payload.case_id,
        user=current_user
    )


@router.patch(
    "/{parcel_id}/encroachment-status",
    response_model=GeoJSONFeature,
    status_code=status.HTTP_200_OK,
    summary="Update parcel encroachment status with evidence document"
)
def update_parcel_encroachment_status(
    parcel_id: str,
    payload: ParcelEncroachmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update statutory encroachment status.
    Permitted role: Field Officer only.
    Mandates an evidence document reference and writes an immutable audit record.
    """
    return ParcelService.update_encroachment_status(
        db=db,
        parcel_id=parcel_id,
        payload=payload,
        user=current_user
    )
