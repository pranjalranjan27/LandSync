# ==============================================================================
# Layer: API Routes — Acquisition Cases & Workflow Actions (app/api/routes/cases.py)
# ALLOWED:
#   - Parse HTTP requests, validate with Pydantic, apply RBAC & ABAC dependencies,
#     and delegate to CaseService or WorkflowService.
# NOT ALLOWED:
#   - NEVER import from repositories/ into this router file.
#   - NO direct database query building or manual session commits/rollbacks here.
#   - NO hardcoded stage transition checks (delegated to services/stage_machine.py).
# ==============================================================================

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Path, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user, require_role, require_jurisdiction_match
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.case import (
    CaseCreate,
    CaseRead,
    CaseDetail,
    CaseActionRequest,
    CaseClarificationRequest,
    CaseRejectRequest,
    NotificationPublishRequest,
)
from app.schemas.audit import AuditLogRead, AuditLogFlagRequest
from app.schemas.document import DocumentCreate, DocumentRead
from app.schemas.workflow import (
    SIAVerdictCreate,
    SIAVerdictRead,
    HearingLogRequest,
    ObjectionCreate,
    ObjectionRead,
    AwardCreate,
    RRSchemeCreate,
    AffectedFamilyRead,
    FamilyStatusUpdate,
)
from app.services.case_service import CaseService
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/cases", tags=["Acquisition Cases & Workflows"])


# --- 1. Core Case Lifecycle ---
@router.post(
    "",
    response_model=CaseDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.REQUIRING_BODY))]
)
def create_case(
    payload: CaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a new land acquisition proposal.
    Accessible exclusively by Requiring Body entities within their assigned jurisdiction.
    """
    return CaseService.create_case(db=db, user=current_user, case_in=payload)


@router.get("", response_model=List[CaseRead], status_code=status.HTTP_200_OK)
def list_cases(
    stage: Optional[str] = Query(None, description="Filter by workflow stage"),
    district_id: Optional[int] = Query(None, description="Filter by district"),
    state_id: Optional[int] = Query(None, description="Filter by state"),
    mine: bool = Query(False, description="Show only proposals submitted by the caller"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List acquisition cases filtered by stage/geography.
    Results are strictly restricted to the caller's ABAC jurisdiction.
    """
    return CaseService.list_cases(
        db=db,
        user=current_user,
        stage=stage,
        district_id=district_id,
        state_id=state_id,
        mine=mine
    )


@router.get(
    "/{id}",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def get_case_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve comprehensive case details with parcels, documents, and SLA metrics.
    Enforces that the caller has jurisdiction over the case's district/state.
    """
    return CaseService.get_case_by_id(db=db, case_id=id, user=current_user)


# --- 2. Statutory Stage Actions ---
@router.post(
    "/{id}/actions/approve",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.DISTRICT_COLLECTOR, UserRole.STATE_APPROVER)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def approve_case_stage(
    id: int,
    payload: Optional[CaseActionRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve proposal to progress to the next statutory stage.
    Single-transaction commit writes the new stage and immutable audit log row.
    """
    remarks = payload.remarks if payload else None
    return CaseService.approve_case(db=db, case_id=id, user=current_user, remarks=remarks)


@router.post(
    "/{id}/actions/reject",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.DISTRICT_COLLECTOR, UserRole.STATE_APPROVER)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def reject_case_proposal(
    id: int,
    payload: CaseRejectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reject proposal with mandatory statutory justification."""
    return CaseService.reject_case(db=db, case_id=id, user=current_user, remarks=payload.remarks)


@router.post(
    "/{id}/actions/request_clarification",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.DISTRICT_COLLECTOR, UserRole.STATE_APPROVER)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def request_case_clarification(
    id: int,
    payload: CaseClarificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Return proposal to Requiring Body requesting specific clarifications."""
    return CaseService.request_clarification(db=db, case_id=id, user=current_user, remarks=payload.remarks)


@router.post(
    "/{id}/actions/submit_sia_verdict",
    response_model=SIAVerdictRead,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.SIA_EXPERT)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def submit_sia_verdict(
    id: int,
    payload: SIAVerdictCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit expert Social Impact Assessment findings for a case in SIA review."""
    return WorkflowService.submit_sia_verdict(db=db, case_id=id, user=current_user, verdict_in=payload)


@router.post(
    "/{id}/actions/log_hearing",
    response_model=SIAVerdictRead,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.SIA_EXPERT, UserRole.DISTRICT_COLLECTOR)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def log_public_hearing(
    id: int,
    payload: HearingLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log the completion date and official minutes document for a public hearing."""
    return WorkflowService.log_hearing(db=db, case_id=id, user=current_user, hearing_in=payload)


@router.post(
    "/{id}/actions/publish_notification",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.DISTRICT_COLLECTOR)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def publish_preliminary_notification(
    id: int,
    payload: Optional[NotificationPublishRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Publish statutory preliminary notification and open public objections window."""
    notif_num = payload.notification_number if payload else None
    doc_id = payload.document_id if payload else None
    remarks = payload.remarks if payload else None
    return CaseService.publish_notification(
        db=db,
        case_id=id,
        user=current_user,
        notification_number=notif_num,
        document_id=doc_id,
        remarks=remarks
    )


@router.post(
    "/{id}/actions/log_objection",
    response_model=ObjectionRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_role(UserRole.FIELD_OFFICER, UserRole.DISTRICT_COLLECTOR)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def log_stakeholder_objection(
    id: int,
    payload: ObjectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record an official citizen/landowner objection during the objections window."""
    return WorkflowService.log_objection(db=db, case_id=id, user=current_user, objection_in=payload)


@router.post(
    "/{id}/actions/declare_award",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.DISTRICT_COLLECTOR)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def declare_statutory_award(
    id: int,
    payload: AwardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Declare final compensation award for the acquisition case."""
    return CaseService.declare_award(db=db, case_id=id, user=current_user, award_in=payload)


@router.post(
    "/{id}/actions/begin_rr",
    response_model=CaseDetail,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.RR_ADMINISTRATOR, UserRole.DISTRICT_COLLECTOR)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def begin_rehabilitation_resettlement(
    id: int,
    payload: RRSchemeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach approved R&R scheme and transition case into rr_in_progress."""
    return CaseService.begin_rr(db=db, case_id=id, user=current_user, rr_in=payload)


@router.post(
    "/{id}/actions/update_family_status",
    response_model=AffectedFamilyRead,
    status_code=status.HTTP_200_OK,
    dependencies=[
        Depends(require_role(UserRole.RR_ADMINISTRATOR, UserRole.FIELD_OFFICER)),
        Depends(require_jurisdiction_match("case"))
    ]
)
def update_family_resettlement_status(
    id: int,
    family_id: int = Query(..., description="ID of the affected family"),
    payload: FamilyStatusUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update R&R milestone for an affected family, recording an append-only status log."""
    return WorkflowService.update_family_status(
        db=db,
        case_id=id,
        family_id=family_id,
        user=current_user,
        status_in=payload
    )


# --- 3. Audit Trail ---
@router.get(
    "/{id}/audit-log",
    response_model=List[AuditLogRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def get_case_audit_log(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve chronological immutable audit trail for a case."""
    logs = CaseService.get_audit_logs(db=db, case_id=id, user=current_user)
    return [
        AuditLogRead(
            id=l.id,
            case_id=l.case_id,
            actor_user_id=l.actor_user_id,
            actor_name=l.actor.name if l.actor else None,
            action=l.action,
            remarks=l.remarks,
            created_at=l.created_at,
            flagged=l.flagged,
            flagged_by_user_id=l.flagged_by_user_id
        )
        for l in logs
    ]


@router.post(
    "/{id}/audit-log/{entryId}/flag",
    response_model=AuditLogRead,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def flag_audit_entry_for_review(
    id: int,
    entryId: int = Path(..., description="Audit log entry ID to flag"),
    payload: Optional[AuditLogFlagRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Flag an audit log entry for supervisory review.
    The only permissible mutation on audit logs: actor/action/timestamps remain strictly immutable.
    """
    remarks = payload.remarks if payload else None
    flagged = CaseService.flag_audit_log(
        db=db,
        case_id=id,
        entry_id=entryId,
        user=current_user,
        remarks=remarks
    )
    return AuditLogRead(
        id=flagged.id,
        case_id=flagged.case_id,
        actor_user_id=flagged.actor_user_id,
        actor_name=flagged.actor.name if flagged.actor else None,
        action=flagged.action,
        remarks=flagged.remarks,
        created_at=flagged.created_at,
        flagged=flagged.flagged,
        flagged_by_user_id=flagged.flagged_by_user_id
    )


# --- 4. Statutory Documents ---
@router.get(
    "/{id}/documents",
    response_model=List[DocumentRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def list_case_documents(
    id: int,
    stage: Optional[str] = Query(None, description="Filter by stage"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List evidentiary statutory documents attached to this case."""
    return CaseService.get_documents(db=db, case_id=id, user=current_user, stage=stage)


@router.post(
    "/{id}/documents",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def upload_case_document(
    id: int,
    payload: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach an evidentiary document to a case stage."""
    return CaseService.add_document(db=db, case_id=id, user=current_user, doc_in=payload)


# --- 5. Affected Families ---
@router.get(
    "/{id}/families",
    response_model=List[AffectedFamilyRead],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_jurisdiction_match("case"))]
)
def list_affected_families(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List project-affected families along with their R&R status milestone history."""
    return WorkflowService.get_families_for_case(db=db, case_id=id, user=current_user)
