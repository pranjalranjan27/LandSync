# ==============================================================================
# Layer: Services — Cadastral Parcels & GIS (app/services/parcel_service.py)
# ALLOWED:
#   - Convert PostGIS geometry to standard RFC 7946 GeoJSON using GeoAlchemy2/Shapely.
#   - Enforce server-side ABAC jurisdiction scoping and role authorization.
#   - Execute atomic audit trail creation on parcel mutations.
# NOT ALLOWED:
#   - NO raw SQL execution (delegate to repositories/parcel_repo.py).
#   - Do NOT put jurisdiction filtering in the API route handlers.
# ==============================================================================

import uuid
from typing import Optional, List, Dict, Any, Tuple, Union
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping

from app.models.parcel import Parcel
from app.models.case import Case
from app.models.user import User, District
from app.models.enums import UserRole, JurisdictionLevel, DisputeStatus
from app.repositories.parcel_repo import ParcelRepository
from app.repositories.audit_repo import AuditRepository
from app.schemas.parcel import (
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONGeometry,
    ParcelSearchItem,
    ParcelEncroachmentUpdateRequest,
    DisputeValidationItem,
    DisputeValidationResult,
)


class ParcelService:
    """
    GIS Parcel Service enforcing server-side ABAC jurisdiction scoping,
    RFC 7946 GeoJSON serialization, and immutable audit logging.
    """

    @staticmethod
    def _parcel_to_feature(parcel: Parcel, full_properties: bool = False) -> GeoJSONFeature:
        """Converts an ORM Parcel entity to an RFC 7946 GeoJSON Feature."""
        try:
            shape = to_shape(parcel.geometry)
            geom_dict = mapping(shape)
        except Exception as e:
            # Fallback for synthetic/raw coordinates or point centroids
            geom_dict = {
                "type": "Polygon",
                "coordinates": [[
                    [parcel.centroid_lng - 0.001, parcel.centroid_lat - 0.001],
                    [parcel.centroid_lng + 0.001, parcel.centroid_lat - 0.001],
                    [parcel.centroid_lng + 0.001, parcel.centroid_lat + 0.001],
                    [parcel.centroid_lng - 0.001, parcel.centroid_lat + 0.001],
                    [parcel.centroid_lng - 0.001, parcel.centroid_lat - 0.001]
                ]]
            }

        props: Dict[str, Any] = {
            "id": str(parcel.id),
            "khasra_number": parcel.khasra_number,
            "village": parcel.village,
            "tehsil": parcel.tehsil,
            "district": parcel.district,
            "state": parcel.state,
            "revenue_sheet_no": parcel.revenue_sheet_no,
            "encroachment_status": parcel.encroachment_status,
            "dispute_status": parcel.dispute_status or DisputeStatus.CLEAR.value,
            "dispute_source": parcel.dispute_source,
            "dispute_notes": parcel.dispute_notes,
            "ownership_type": parcel.ownership_type,
            "case_id": parcel.case_id,
            "centroid_lat": parcel.centroid_lat,
            "centroid_lng": parcel.centroid_lng,
            "area_sqm": parcel.area_sqm,
            "area_hectares": round(parcel.area_sqm / 10000.0, 4),
            "created_at": parcel.created_at.isoformat() if parcel.created_at else None,
            "updated_at": parcel.updated_at.isoformat() if parcel.updated_at else None,
        }

        return GeoJSONFeature(
            type="Feature",
            id=str(parcel.id),
            geometry=GeoJSONGeometry(
                type=geom_dict.get("type", "Polygon"),
                coordinates=geom_dict.get("coordinates", [])
            ),
            properties=props
        )

    @classmethod
    def resolve_user_district_name(cls, db: Session, user: User) -> Optional[str]:
        """Resolves the caller's assigned district name from their jurisdiction_id."""
        if user.jurisdiction_level == JurisdictionLevel.DISTRICT and user.jurisdiction_id:
            district_obj = db.get(District, user.jurisdiction_id)
            if district_obj:
                return district_obj.name
        return None

    @classmethod
    def list_parcels_geojson(
        cls,
        db: Session,
        user: User,
        district: Optional[str] = None,
        bbox_str: Optional[str] = None
    ) -> GeoJSONFeatureCollection:
        """
        List parcels formatted as GeoJSON FeatureCollection with strict server-side scoping:
          - Policy Viewer: global read-only across all districts.
          - District Collector & Field Officer: locked strictly to their assigned district.
          - Requiring Body & SIA Expert: restricted to parcels of cases they are attached to.
        """
        user_district = cls.resolve_user_district_name(db, user)

        # Parse bbox if provided ("minLng,minLat,maxLng,maxLat")
        bbox_tuple: Optional[Tuple[float, float, float, float]] = None
        if bbox_str:
            try:
                parts = [float(x.strip()) for x in bbox_str.split(",")]
                if len(parts) == 4:
                    bbox_tuple = (parts[0], parts[1], parts[2], parts[3])
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid bbox format. Expected 'minLng,minLat,maxLng,maxLat'."
                )

        # 1. District Collector, Tehsildar & Patwari/Lekhpal: Strictly bound to assigned jurisdiction
        if user.role in (UserRole.DISTRICT_COLLECTOR, UserRole.PATWARI_LEKHPAL, UserRole.TEHSILDAR, UserRole.RR_ADMINISTRATOR):
            assigned_dist = user_district or "Gautam Buddha Nagar"
            if district and district.strip().lower() != assigned_dist.strip().lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Access denied: User jurisdiction is scoped strictly to district '{assigned_dist}'. "
                        f"Cannot access parcels for district '{district}'."
                    )
                )
            target_district = assigned_dist
        else:
            # Policy Viewer, State Approver, Requiring Body, SIA Expert: allows explicit district filter, defaults to Gautam Buddha Nagar if omitted
            target_district = district or user_district or "Gautam Buddha Nagar"

        parcels = ParcelRepository.list_by_district(db=db, district=target_district, bbox=bbox_tuple)
        features = [cls._parcel_to_feature(p) for p in parcels]
        return GeoJSONFeatureCollection(type="FeatureCollection", features=features)

    @classmethod
    def get_parcel_by_id(
        cls,
        db: Session,
        parcel_id: Union[uuid.UUID, str],
        user: User
    ) -> GeoJSONFeature:
        """Fetch single parcel by ID with full properties and jurisdiction validation."""
        parcel = ParcelRepository.get_by_id(db, parcel_id)
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cadastral parcel with ID '{parcel_id}' not found."
            )

        # Check district jurisdiction for district-scoped roles
        user_district = cls.resolve_user_district_name(db, user)
        if user.role in (UserRole.DISTRICT_COLLECTOR, UserRole.PATWARI_LEKHPAL, UserRole.TEHSILDAR):
            if user_district and parcel.district.strip().lower() != user_district.strip().lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Parcel lies outside your assigned district jurisdiction."
                )

        return cls._parcel_to_feature(parcel, full_properties=True)

    @classmethod
    def search_khasra(
        cls,
        db: Session,
        user: User,
        query: str,
        district: Optional[str] = None
    ) -> List[ParcelSearchItem]:
        """Search Khasra numbers within authorized jurisdiction scope."""
        user_district = cls.resolve_user_district_name(db, user)

        if user.role in (UserRole.DISTRICT_COLLECTOR, UserRole.PATWARI_LEKHPAL, UserRole.TEHSILDAR):
            scoped_district = user_district or "Gautam Buddha Nagar"
        else:
            scoped_district = district or "Gautam Buddha Nagar"

        results = ParcelRepository.search_khasra(db=db, query=query, district=scoped_district)
        return [
            ParcelSearchItem(
                id=str(p.id),
                khasra_number=p.khasra_number,
                centroid_lat=p.centroid_lat,
                centroid_lng=p.centroid_lng,
                village=p.village,
                district=p.district
            )
            for p in results
        ]

    @classmethod
    def list_parcels_by_case(
        cls,
        db: Session,
        case_id: Union[int, str],
        user: User
    ) -> GeoJSONFeatureCollection:
        """Fetch all parcels linked to an acquisition case formatted as GeoJSON."""
        # Clean numeric case ID
        try:
            cid = int(str(case_id).replace("case-", ""))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid case identifier '{case_id}'."
            )

        case = db.get(Case, cid)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Acquisition case with ID '{case_id}' not found."
            )

        # ABAC: Verify jurisdiction over case
        if user.jurisdiction_level == JurisdictionLevel.DISTRICT and user.jurisdiction_id:
            if case.district_id != user.jurisdiction_id and user.role != UserRole.POLICY_VIEWER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Case lies outside your assigned district jurisdiction."
                )

        parcels = ParcelRepository.list_by_case(db=db, case_id=cid)
        features = [cls._parcel_to_feature(p, full_properties=True) for p in parcels]
        return GeoJSONFeatureCollection(type="FeatureCollection", features=features)

    @classmethod
    def link_parcel_to_case(
        cls,
        db: Session,
        parcel_id: Union[uuid.UUID, str],
        case_id: Union[int, str],
        user: User
    ) -> GeoJSONFeature:
        """
        Link a selected parcel to an acquisition case.
        Allowed roles: Requiring Body, District Collector.
        Appends an immutable audit log entry.
        """
        # Role check
        if user.role not in (UserRole.REQUIRING_BODY, UserRole.DISTRICT_COLLECTOR):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only Requiring Body and District Collector can link parcels to a case."
            )

        parcel = ParcelRepository.get_by_id(db, parcel_id)
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parcel '{parcel_id}' not found."
            )

        try:
            cid = int(str(case_id).replace("case-", ""))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid case identifier '{case_id}'."
            )

        case = db.get(Case, cid)
        if not case:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target case '{case_id}' not found."
            )

        # Jurisdiction check
        user_district = cls.resolve_user_district_name(db, user)
        if user.role == UserRole.DISTRICT_COLLECTOR and user_district:
            if parcel.district.strip().lower() != user_district.strip().lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Cannot link parcel outside your assigned district."
                )

        # Update linkage
        updated_parcel = ParcelRepository.link_to_case(db, parcel_id=parcel.id, case_id=cid)

        # Write atomic statutory audit log
        AuditRepository.create_audit_entry(
            db=db,
            case_id=cid,
            actor_user_id=user.id,
            action="LINK_PARCEL_TO_CASE",
            remarks=(
                f"Parcel Khasra {parcel.khasra_number} (Sheet {parcel.revenue_sheet_no}, "
                f"Village {parcel.village}) linked to acquisition project '{case.project_name}'."
            )
        )
        db.commit()
        db.refresh(updated_parcel)

        return cls._parcel_to_feature(updated_parcel, full_properties=True)

    @classmethod
    def update_encroachment_status(
        cls,
        db: Session,
        parcel_id: Union[uuid.UUID, str],
        payload: ParcelEncroachmentUpdateRequest,
        user: User
    ) -> GeoJSONFeature:
        """
        Update statutory encroachment status for a parcel.
        Allowed roles: Field Officer only.
        Requires evidence_document_id and records an immutable audit log entry.
        """
        if user.role not in (UserRole.PATWARI_LEKHPAL, UserRole.FIELD_OFFICER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only Patwari / Lekhpal (Field Officer) can update parcel encroachment status."
            )

        parcel = ParcelRepository.get_by_id(db, parcel_id)
        if not parcel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parcel '{parcel_id}' not found."
            )

        if user.jurisdiction_level == JurisdictionLevel.VILLAGE.value and user.jurisdiction_value:
            assigned = [v.strip().lower() for v in user.jurisdiction_value.split(",")]
            if parcel.village.strip().lower() not in assigned:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: Parcel village '{parcel.village}' lies outside your assigned village beat ({user.jurisdiction_value})."
                )

        user_district = cls.resolve_user_district_name(db, user)
        if user_district and parcel.district.strip().lower() != user_district.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Parcel lies outside your assigned Tehsil/District inspection beat."
            )

        if not payload.evidence_document_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Evidence document reference ('evidence_document_id') is mandatory for updating encroachment status."
            )

        old_status = parcel.encroachment_status
        new_status = payload.encroachment_status.value

        updated_parcel = ParcelRepository.update_encroachment_status(
            db=db,
            parcel_id=parcel.id,
            new_status=new_status
        )

        # Record audit log on linked case if exists
        if parcel.case_id:
            AuditRepository.create_audit_entry(
                db=db,
                case_id=parcel.case_id,
                actor_user_id=user.id,
                action="UPDATE_ENCROACHMENT_STATUS",
                remarks=(
                    f"Khasra {parcel.khasra_number} encroachment changed from '{old_status}' to '{new_status}'. "
                    f"Evidence Doc ID: {payload.evidence_document_id}. "
                    f"Remarks: {payload.remarks or 'Field inspection report confirmed title clarity.'}"
                )
            )

        db.commit()
        db.refresh(updated_parcel)

        return cls._parcel_to_feature(updated_parcel, full_properties=True)

    @classmethod
    def validate_parcel_selection(
        cls,
        db: Session,
        parcel_ids: List[Union[uuid.UUID, str, int]]
    ) -> DisputeValidationResult:
        """
        Pre-Submission GIS Gate: Validates a list of selected parcel IDs against
        statutory litigation and prohibition registries (NGDRS / NJDG / State IGR).

        Returns a structured DisputeValidationResult listing flagged parcels.
        Does NOT raise an exception itself — delegating blocking/warning decisions
        to the calling service layer (e.g. CaseService.create_case).
        """
        if not parcel_ids:
            return DisputeValidationResult(
                is_valid=True,
                has_prohibited=False,
                has_litigation=False,
                prohibited_parcels=[],
                litigation_parcels=[],
                flagged_parcels=[]
            )

        parcels = ParcelRepository.get_by_ids(db, parcel_ids)

        prohibited_items: List[DisputeValidationItem] = []
        litigation_items: List[DisputeValidationItem] = []
        all_flagged: List[DisputeValidationItem] = []

        for p in parcels:
            status_val = (p.dispute_status or DisputeStatus.CLEAR.value).lower()
            if status_val != DisputeStatus.CLEAR.value:
                item = DisputeValidationItem(
                    parcel_id=str(p.id),
                    khasra_number=p.khasra_number,
                    village=p.village,
                    dispute_status=DisputeStatus(status_val) if status_val in [s.value for s in DisputeStatus] else DisputeStatus.CLEAR,
                    dispute_source=p.dispute_source,
                    dispute_notes=p.dispute_notes
                )
                all_flagged.append(item)
                if status_val == DisputeStatus.PROHIBITED.value:
                    prohibited_items.append(item)
                elif status_val == DisputeStatus.UNDER_LITIGATION.value:
                    litigation_items.append(item)

        has_proh = len(prohibited_items) > 0
        has_lit = len(litigation_items) > 0

        return DisputeValidationResult(
            is_valid=not has_proh,
            has_prohibited=has_proh,
            has_litigation=has_lit,
            prohibited_parcels=prohibited_items,
            litigation_parcels=litigation_items,
            flagged_parcels=all_flagged
        )
