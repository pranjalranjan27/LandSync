# ==============================================================================
# Layer: Pydantic Schemas — Cadastral Parcels & GeoJSON (app/schemas/parcel.py)
# ALLOWED:
#   - Define request/response validation schemas for land parcels in Pydantic v2.
#   - Define standard RFC 7946 GeoJSON Feature and FeatureCollection representations.
#   - Define search items, case linkage, and encroachment update payloads.
# NOT ALLOWED:
#   - NEVER execute GIS PostGIS functions or connect to DB in schema definitions.
# ==============================================================================

import uuid
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EncroachmentStatus, OwnershipType, DisputeStatus


class ParcelBase(BaseModel):
    khasra_number: str = Field(..., max_length=100)
    village: str = Field(..., max_length=150)
    tehsil: str = Field(..., max_length=150)
    district: str = Field(..., max_length=150)
    state: str = Field(..., max_length=150)
    revenue_sheet_no: str = Field(..., max_length=50)
    centroid_lat: float
    centroid_lng: float
    area_sqm: float
    encroachment_status: EncroachmentStatus = EncroachmentStatus.CLEAR
    dispute_status: DisputeStatus = DisputeStatus.CLEAR
    dispute_source: Optional[str] = None
    dispute_notes: Optional[str] = None
    ownership_type: OwnershipType = OwnershipType.PRIVATE
    case_id: Optional[Union[int, str]] = None


class ParcelCreate(ParcelBase):
    coordinates: Optional[List[List[List[float]]]] = None


class ParcelRead(ParcelBase):
    id: Union[uuid.UUID, str]

    model_config = ConfigDict(from_attributes=True)


# RFC 7946 Compliant GeoJSON Schemas
class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # Polygon rings: [[[lng, lat], ...]]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


# Specialized Action & Search Schemas
class ParcelSearchItem(BaseModel):
    id: str
    khasra_number: str
    centroid_lat: float
    centroid_lng: float
    village: Optional[str] = None
    district: Optional[str] = None


class ParcelLinkCaseRequest(BaseModel):
    case_id: Union[int, str] = Field(
        ...,
        description="Case ID to link this parcel to (e.g. integer or UUID)"
    )


class ParcelEncroachmentUpdateRequest(BaseModel):
    encroachment_status: EncroachmentStatus = Field(
        ...,
        description="Updated statutory encroachment status: clear, disputed, or encroached"
    )
    evidence_document_id: Union[int, str] = Field(
        ...,
        description="Mandatory evidence document upload reference supporting status change"
    )
    remarks: Optional[str] = Field(
        None,
        max_length=500,
        description="Field inspection notes or surveyor remarks"
    )


# Pre-Submission GIS Dispute Gate Schemas
class DisputeValidationItem(BaseModel):
    parcel_id: str
    khasra_number: str
    village: str
    dispute_status: DisputeStatus
    dispute_source: Optional[str] = None
    dispute_notes: Optional[str] = None


class DisputeValidationResult(BaseModel):
    is_valid: bool = Field(
        ...,
        description="True if no parcels are prohibited (creation can proceed, with or without litigation warning)"
    )
    has_prohibited: bool = Field(
        ...,
        description="True if any parcel has dispute_status == 'prohibited'"
    )
    has_litigation: bool = Field(
        ...,
        description="True if any parcel has dispute_status == 'under_litigation'"
    )
    prohibited_parcels: List[DisputeValidationItem] = []
    litigation_parcels: List[DisputeValidationItem] = []
    flagged_parcels: List[DisputeValidationItem] = []


class ParcelValidateSelectionRequest(BaseModel):
    parcel_ids: List[Union[uuid.UUID, str, int]] = Field(
        ...,
        description="List of parcel IDs to check for legal disputes or prohibitions"
    )
