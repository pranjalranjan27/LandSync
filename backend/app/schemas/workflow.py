# ==============================================================================
# Layer: Pydantic Schemas — Stage-Specific Workflows (app/schemas/workflow.py)
# ALLOWED:
#   - Define specialized request and response DTOs for SIA verdicts, public hearings,
#     objections, statutory awards, R&R schemes, and affected family milestone tracking.
# NOT ALLOWED:
#   - NO workflow stage transitions or database operations within this schema file.
# ==============================================================================

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SIACostRating, SIARecommendation, RRStatus, CaseStage


# --- 1. SIA Verdict Schemas ---
class SIAVerdictCreate(BaseModel):
    agree_public_purpose: bool
    min_land_confirmed: bool
    alternate_location_feasible: bool
    independent_family_estimate: int = Field(..., ge=0)
    cost_rating: SIACostRating
    recommendation: SIARecommendation
    report_document_id: Optional[int] = None
    hearing_date: Optional[date] = None
    hearing_minutes_document_id: Optional[int] = None


class SIAVerdictRead(SIAVerdictCreate):
    id: int
    case_id: int
    submitted_by_user_id: int
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HearingLogRequest(BaseModel):
    hearing_date: date
    hearing_minutes_document_id: int
    remarks: Optional[str] = None


# --- 2. Objection Schemas ---
class ObjectionCreate(BaseModel):
    description: str = Field(..., min_length=10)
    document_id: Optional[int] = None


class ObjectionRead(ObjectionCreate):
    id: int
    case_id: int
    logged_by_user_id: int
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- 3. Award Schemas ---
class AwardCreate(BaseModel):
    compensation_amount: Decimal = Field(..., gt=0, decimal_places=2, max_digits=14)
    award_document_id: Optional[int] = None
    evidence_document_id: Optional[int] = None
    remarks: Optional[str] = None


class AwardRead(BaseModel):
    id: int
    case_id: int
    compensation_amount: Decimal
    award_document_id: Optional[int] = None
    declared_by_user_id: int
    declared_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- 4. R&R Scheme Schemas ---
class RRSchemeCreate(BaseModel):
    scheme_document_id: int
    development_plan_document_id: int
    remarks: Optional[str] = None


class RRSchemeRead(BaseModel):
    id: int
    case_id: int
    scheme_document_id: Optional[int] = None
    development_plan_document_id: Optional[int] = None
    created_by_user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- 5. Affected Family & Milestone Log Schemas ---
class AffectedFamilyCreate(BaseModel):
    family_head_name: str = Field(..., min_length=2, max_length=150)
    current_address: str = Field(..., min_length=5)
    land_reference: str = Field(..., min_length=2, max_length=100)
    rr_status: RRStatus = RRStatus.SCHEME_COMMUNICATED


class FamilyStatusLogRead(BaseModel):
    id: int
    family_id: int
    status: RRStatus
    document_id: Optional[int] = None
    remarks: Optional[str] = None
    updated_by_user_id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AffectedFamilyRead(AffectedFamilyCreate):
    id: int
    case_id: int
    updated_at: datetime
    status_logs: List[FamilyStatusLogRead] = []

    model_config = ConfigDict(from_attributes=True)


class FamilyStatusUpdate(BaseModel):
    status: RRStatus
    document_id: Optional[int] = Field(None, description="Supporting evidence document ID")
    remarks: Optional[str] = None


# --- 6. SLA Duration Config Schema ---
class StageDurationConfigRead(BaseModel):
    stage: CaseStage
    expected_days: int

    model_config = ConfigDict(from_attributes=True)
