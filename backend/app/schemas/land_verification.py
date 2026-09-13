# ==============================================================================
# Layer: Pydantic Schemas — Land Verification (app/schemas/land_verification.py)
# ALLOWED:
#   - Define Pydantic v2 schemas for statutory ground verification under Section 4.
#   - Enforce data validation on asset inventory enumeration and Tehsildar return notes.
# NOT ALLOWED:
#   - NO database queries or route definitions here.
# ==============================================================================

import uuid
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, Field

AssetType = Literal["tree", "crop", "structure", "well", "tubewell", "fence"]


class AssetItem(BaseModel):
    """Enumerated standing asset item on cadastral parcel."""
    type: AssetType
    description: str = Field(..., min_length=2, max_length=255)
    estimated_count_or_area: str = Field(..., min_length=1, max_length=100)


class LandVerificationCreate(BaseModel):
    """Payload submitted by Patwari / Lekhpal for Section 4 field verification."""
    parcel_ids: List[str] = Field(default_factory=list)
    khasra_ownership_confirmed: bool = Field(default=False)
    ownership_notes: Optional[str] = Field(default=None, max_length=1000)
    boundary_verification_notes: str = Field(..., min_length=5, max_length=2000)
    asset_inventory: List[AssetItem] = Field(default_factory=list)
    notice_served_at: Optional[datetime] = None
    notice_served_notes: Optional[str] = Field(default=None, max_length=1000)


class LandVerificationReturn(BaseModel):
    """Payload submitted by Tehsildar when returning verification for correction."""
    notes: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="Mandatory statutory reasoning detailing required corrections"
    )


class LandVerificationRead(BaseModel):
    """Serialized representation of a Land Verification record."""
    id: uuid.UUID
    case_id: int
    parcel_ids: List[str] = Field(default_factory=list)
    khasra_ownership_confirmed: bool
    ownership_notes: Optional[str] = None
    boundary_verification_notes: str
    asset_inventory: List[AssetItem] = Field(default_factory=list)
    notice_served_at: Optional[datetime] = None
    notice_served_notes: Optional[str] = None
    submitted_by_officer_id: int
    submitted_by_officer_name: Optional[str] = None
    submitted_at: datetime
    status: str
    certified_by_tehsildar_id: Optional[int] = None
    certified_by_tehsildar_name: Optional[str] = None
    certified_at: Optional[datetime] = None
    tehsildar_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
