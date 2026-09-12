# ==============================================================================
# Layer: Pydantic Schemas — Cadastral Parcels & GeoJSON (app/schemas/parcel.py)
# ALLOWED:
#   - Define request/response validation schemas for land parcels.
#   - Define standard RFC 7946 GeoJSON Feature and FeatureCollection representations.
# NOT ALLOWED:
#   - NEVER execute GIS PostGIS functions or connect to DB in schema definitions.
# ==============================================================================

from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ParcelStatus


class ParcelBase(BaseModel):
    khasra_number: str = Field(..., max_length=100)
    district_id: int
    area_hectares: Decimal = Field(..., decimal_places=4, max_digits=10)
    status: ParcelStatus = ParcelStatus.NOT_STARTED
    current_case_id: Optional[int] = None


class ParcelCreate(ParcelBase):
    coordinates: List[List[List[float]]]  # GeoJSON Polygon rings: [[[lon, lat], ...]]


class ParcelRead(ParcelBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# RFC 7946 Compliant GeoJSON Schemas
class GeoJSONGeometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: int
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
