# ==============================================================================
# Layer: API Routes — Multi-Format Statutory Export (app/api/routes/export.py)
# ALLOWED:
#   - Parse export request parameters, enforce user authentication, and delegate
#     to canonical service listing methods.
#   - Ensure exported datasets are filtered STRICTLY through the caller's role + ABAC jurisdiction.
#   - Serialize output through official Pydantic schemas prior to generating file bytes.
# NOT ALLOWED:
#   - NEVER build separate, unfiltered database query paths for exports.
#   - NO raw repository or SQL queries here — delegate exclusively to service layer.
# ==============================================================================

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.audit import AuditLogRead
from app.services.case_service import CaseService
from app.services.parcel_service import ParcelService
from app.repositories.audit_repo import AuditRepository
from app.core.export_utils import (
    generate_csv,
    generate_excel,
    generate_docx_table,
    CSV_MIME_TYPE,
    EXCEL_MIME_TYPE,
    DOCX_MIME_TYPE,
)

router = APIRouter(tags=["Multi-Format Data Export"])


@router.get(
    "/{resource}",
    summary="Export jurisdiction-filtered records in CSV, Excel, or Word format",
    response_description="Raw binary file stream with appropriate Content-Disposition header"
)
def export_resource(
    resource: str,
    format: str = Query("csv", description="Output file format: 'csv', 'xlsx', or 'docx'"),
    # Case filters
    stage: Optional[str] = Query(None, description="Filter cases by statutory stage"),
    district_id: Optional[int] = Query(None, description="Filter cases by district ID"),
    state_id: Optional[int] = Query(None, description="Filter cases by state ID"),
    mine: bool = Query(False, description="Filter cases created by current requiring body"),
    # Parcel filters
    district: Optional[str] = Query(None, description="Filter parcels by district name"),
    bbox: Optional[str] = Query(None, description="Filter parcels by bounding box 'minLng,minLat,maxLng,maxLat'"),
    # Audit log filters
    case_id: Optional[int] = Query(None, description="Filter audit trail for a specific case ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Exports tabular resources matching the user's active screen filters,
    strictly enforcing role and jurisdiction authorization.
    """
    format_clean = format.lower().strip()
    if format_clean not in ("csv", "xlsx", "docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format '{format}'. Supported formats are: csv, xlsx, docx."
        )

    resource_clean = resource.lower().strip()
    rows: List[Dict[str, Any]] = []
    title = f"Statutory {resource_clean.title()} Export"

    # --- 1. Resource: Cases ---
    if resource_clean == "cases":
        title = "Land Acquisition Cases Register"
        # Delegate directly to existing jurisdiction-filtered service method
        case_models = CaseService.list_cases(
            db=db,
            user=current_user,
            stage=stage,
            district_id=district_id,
            state_id=state_id,
            mine=mine
        )
        # Serialize with Pydantic model_dump()
        rows = [c.model_dump() for c in case_models]

    # --- 2. Resource: Parcels ---
    elif resource_clean == "parcels":
        title = "Cadastral Land Parcels Ledger"
        # Delegate directly to existing jurisdiction-filtered parcel service method
        feature_collection = ParcelService.list_parcels_geojson(
            db=db,
            user=current_user,
            district=district,
            bbox_str=bbox
        )
        for feat in feature_collection.features:
            if hasattr(feat.properties, "model_dump"):
                prop_dict = feat.properties.model_dump()
            elif isinstance(feat.properties, dict):
                prop_dict = dict(feat.properties)
            else:
                prop_dict = dict(feat.properties)

            geom = feat.geometry
            if hasattr(geom, "type"):
                prop_dict["geometry_type"] = geom.type
            elif isinstance(geom, dict):
                prop_dict["geometry_type"] = geom.get("type", "Polygon")
            else:
                prop_dict["geometry_type"] = "Polygon"
            rows.append(prop_dict)

    # --- 3. Resource: Audit Log ---
    elif resource_clean in ("audit-log", "audit_log", "audit"):
        title = "Statutory Immutable Audit Trail"
        if case_id is not None:
            # Case-scoped audit trail (jurisdiction enforced within CaseService.get_audit_logs)
            raw_logs = CaseService.get_audit_logs(db=db, case_id=case_id, user=current_user)
            rows = [
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
                ).model_dump()
                for l in raw_logs
            ]
        else:
            # Jurisdiction-scoped audit trail across all accessible cases
            accessible_cases = CaseService.list_cases(
                db=db,
                user=current_user,
                stage=stage,
                district_id=district_id,
                state_id=state_id,
                mine=mine
            )
            case_ids = [c.id for c in accessible_cases]
            for c_id in case_ids:
                logs = AuditRepository.get_audit_logs_for_case(db=db, case_id=c_id)
                for l in logs:
                    rows.append(
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
                        ).model_dump()
                    )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource '{resource}' is not supported for export. Supported: cases, parcels, audit-log."
        )

    # --- Generate binary bytes based on format ---
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if format_clean == "csv":
        content_bytes, mime_type = generate_csv(rows)
        filename = f"{resource_clean}_{timestamp}.csv"
    elif format_clean == "xlsx":
        content_bytes, mime_type = generate_excel(rows, sheet_title=resource_clean[:30])
        filename = f"{resource_clean}_{timestamp}.xlsx"
    elif format_clean == "docx":
        content_bytes, mime_type = generate_docx_table(rows, title=title)
        filename = f"{resource_clean}_{timestamp}.docx"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid format")

    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Access-Control-Expose-Headers": "Content-Disposition"
    }

    return Response(
        content=content_bytes,
        media_type=mime_type,
        headers=headers
    )
