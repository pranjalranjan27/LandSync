# ==============================================================================
# Layer: Pydantic Schemas — Users, Geography & Auth (app/schemas/user.py)
# ALLOWED:
#   - Define Pydantic v2 data transfer objects for validation, serialization, and deserialization.
#   - Use ConfigDict(from_attributes=True) for seamless ORM conversion.
# NOT ALLOWED:
#   - NO database queries, NO ORM column definitions, and NO password hashing here.
#   - Schemas must remain decoupled from database engines.
# ==============================================================================

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole, JurisdictionLevel


class StateRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class DistrictRead(BaseModel):
    id: int
    name: str
    state_id: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    role: UserRole
    jurisdiction_level: JurisdictionLevel
    jurisdiction_id: Optional[int] = None
    jurisdiction_value: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserRead(UserBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    role: Optional[str] = None
    jurisdiction_level: Optional[str] = None
    jurisdiction_id: Optional[int] = None
    jurisdiction_value: Optional[str] = None
