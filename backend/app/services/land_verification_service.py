# ==============================================================================
# Layer: Services — Land Verification (app/services/land_verification_service.py)
# ALLOWED:
#   - Orchestrate business logic for Section 4 land verification hierarchy.
#   - Enforce village-level jurisdiction for Patwari/Lekhpal and tehsil-level for Tehsildar.
#   - Atomically create statutory audit log entries on submission, certification, and return.
# NOT ALLOWED:
#   - NO route definition or HTTP response rendering here.
# ==============================================================================

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.land_verification import LandVerificationRecord
from app.models.case import Case
from app.models.user import User
from app.models.enums import UserRole, JurisdictionLevel, LandVerificationStatus
from app.schemas.land_verification import LandVerificationCreate, LandVerificationRead, AssetItem
from app.repositories.land_verification_repo import LandVerificationRepository
from app.repositories.case_repo import CaseRepository
from app.repositories.audit_repo import AuditRepository
from app.services.jurisdiction import check_user_jurisdiction, enforce_jurisdiction


class LandVerificationService:
    """Business service governing Section 4 Ground Revenue Verification."""

    @classmethod
    def _to_read(cls, db: Session, record: LandVerificationRecord) -> LandVerificationRead:
        officer = db.get(User, record.submitted_by_officer_id)
        tehsildar = db.get(User, record.certified_by_tehsildar_id) if record.certified_by_tehsildar_id else None

        inventory_items = []
        if isinstance(record.asset_inventory, list):
            for item in record.asset_inventory:
                if isinstance(item, dict):
                    inventory_items.append(AssetItem(**item))
                elif isinstance(item, AssetItem):
                    inventory_items.append(item)

        return LandVerificationRead(
            id=record.id,
            case_id=record.case_id,
            parcel_ids=record.parcel_ids or [],
            khasra_ownership_confirmed=record.khasra_ownership_confirmed,
            ownership_notes=record.ownership_notes,
            boundary_verification_notes=record.boundary_verification_notes,
            asset_inventory=inventory_items,
            notice_served_at=record.notice_served_at,
            notice_served_notes=record.notice_served_notes,
            submitted_by_officer_id=record.submitted_by_officer_id,
            submitted_by_officer_name=officer.name if officer else None,
            submitted_at=record.submitted_at,
            status=record.status,
            certified_by_tehsildar_id=record.certified_by_tehsildar_id,
            certified_by_tehsildar_name=tehsildar.name if tehsildar else None,
            certified_at=record.certified_at,
            tehsildar_notes=record.tehsildar_notes,
        )

    @classmethod
    def submit_verification(
        cls,
        db: Session,
        case_id: int,
        data: LandVerificationCreate,
        officer_user: User
    ) -> LandVerificationRead:
        """
        Submits on-ground verification facts.
        Callable only by patwari_lekhpal whose assigned village matches linked parcel(s).
        """
        if officer_user.role != UserRole.PATWARI_LEKHPAL.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Only Patwari / Lekhpal can submit land verification (caller role: '{officer_user.role}')."
            )

        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        # Village jurisdiction check: linked parcel's village must match officer's assigned village(s)
        if officer_user.jurisdiction_level == JurisdictionLevel.VILLAGE.value and officer_user.jurisdiction_value:
            assigned_villages = [v.strip().lower() for v in officer_user.jurisdiction_value.split(",")]
            case_villages = [p.village.strip().lower() for p in case.parcels if p.village]
            
            # If case has parcels, ensure at least one matches assigned village
            if case_villages and not any(v in assigned_villages for v in case_villages):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Forbidden: Patwari/Lekhpal '{officer_user.name}' is assigned to village(s) "
                        f"'{officer_user.jurisdiction_value}', but Case #{case_id} parcels are in {set(case_villages)}."
                    )
                )

        now = datetime.now(timezone.utc)
        record_data = {
            "case_id": case.id,
            "parcel_ids": data.parcel_ids or [str(p.id) for p in case.parcels],
            "khasra_ownership_confirmed": data.khasra_ownership_confirmed,
            "ownership_notes": data.ownership_notes,
            "boundary_verification_notes": data.boundary_verification_notes,
            "asset_inventory": [item.model_dump() for item in data.asset_inventory],
            "notice_served_at": data.notice_served_at,
            "notice_served_notes": data.notice_served_notes,
            "submitted_by_officer_id": officer_user.id,
            "submitted_at": now,
            "status": LandVerificationStatus.SUBMITTED.value,
        }

        try:
            record = LandVerificationRepository.create(db, record_data)
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=officer_user.id,
                action="land_verification_submitted",
                remarks=(
                    f"Section 4 land verification submitted by Patwari/Lekhpal {officer_user.name}. "
                    f"Khasra ownership confirmed: {data.khasra_ownership_confirmed}. "
                    f"Assets inventoried: {len(data.asset_inventory)} items."
                )
            )
            db.commit()
            db.refresh(record)
        except Exception:
            db.rollback()
            raise

        return cls._to_read(db, record)

    @classmethod
    def certify_verification(
        cls,
        db: Session,
        record_id: Any,
        tehsildar_user: User
    ) -> LandVerificationRead:
        """
        Certifies land verification under quasi-judicial revenue authority.
        Callable only by Tehsildar whose assigned tehsil matches parcel's tehsil.
        """
        if tehsildar_user.role != UserRole.TEHSILDAR.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Only Tehsildar can certify land verification (caller role: '{tehsildar_user.role}')."
            )

        record = LandVerificationRepository.get_by_id(db, record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Land Verification record '{record_id}' not found."
            )

        case = db.get(Case, record.case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked case not found.")

        # Tehsil jurisdiction check
        if tehsildar_user.jurisdiction_level == JurisdictionLevel.TEHSIL.value and tehsildar_user.jurisdiction_value:
            assigned_tehsil = tehsildar_user.jurisdiction_value.strip().lower()
            case_tehsils = [p.tehsil.strip().lower() for p in case.parcels if p.tehsil]
            if case_tehsils and assigned_tehsil not in case_tehsils:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Forbidden: Tehsildar '{tehsildar_user.name}' is assigned to tehsil '{tehsildar_user.jurisdiction_value}', "
                        f"but Case #{case.id} parcels are located in {set(case_tehsils)}."
                    )
                )

        now = datetime.now(timezone.utc)
        try:
            LandVerificationRepository.update(
                db,
                record,
                status=LandVerificationStatus.CERTIFIED.value,
                certified_by_tehsildar_id=tehsildar_user.id,
                certified_at=now,
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=tehsildar_user.id,
                action="land_verification_certified",
                remarks=(
                    f"Section 4 land verification certified by Tehsildar {tehsildar_user.name}. "
                    "Proposal unblocked for State Review transition."
                )
            )
            db.commit()
            db.refresh(record)
        except Exception:
            db.rollback()
            raise

        return cls._to_read(db, record)

    @classmethod
    def return_for_correction(
        cls,
        db: Session,
        record_id: Any,
        notes: str,
        tehsildar_user: User
    ) -> LandVerificationRead:
        """
        Returns land verification to Patwari/Lekhpal with mandatory deficiency notes.
        Callable only by Tehsildar.
        """
        if tehsildar_user.role != UserRole.TEHSILDAR.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Only Tehsildar can return land verification (caller role: '{tehsildar_user.role}')."
            )

        if not notes or len(notes.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deficiency notes detailing required corrections are mandatory when returning verification."
            )

        record = LandVerificationRepository.get_by_id(db, record_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Land Verification record '{record_id}' not found."
            )

        case = db.get(Case, record.case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked case not found.")

        # Tehsil jurisdiction check
        if tehsildar_user.jurisdiction_level == JurisdictionLevel.TEHSIL.value and tehsildar_user.jurisdiction_value:
            assigned_tehsil = tehsildar_user.jurisdiction_value.strip().lower()
            case_tehsils = [p.tehsil.strip().lower() for p in case.parcels if p.tehsil]
            if case_tehsils and assigned_tehsil not in case_tehsils:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Forbidden: Tehsildar '{tehsildar_user.name}' is assigned to tehsil '{tehsildar_user.jurisdiction_value}', "
                        f"but Case #{case.id} parcels are in {set(case_tehsils)}."
                    )
                )

        try:
            LandVerificationRepository.update(
                db,
                record,
                status=LandVerificationStatus.RETURNED_FOR_CORRECTION.value,
                tehsildar_notes=notes.strip(),
            )
            AuditRepository.create_audit_entry(
                db=db,
                case_id=case.id,
                actor_user_id=tehsildar_user.id,
                action="land_verification_returned_for_correction",
                remarks=(
                    f"Land verification returned for correction by Tehsildar {tehsildar_user.name}. "
                    f"Statutory deficiency notes: {notes.strip()}"
                )
            )
            db.commit()
            db.refresh(record)
        except Exception:
            db.rollback()
            raise

        return cls._to_read(db, record)

    @classmethod
    def get_verification_for_case(
        cls,
        db: Session,
        case_id: int,
        user: User
    ) -> Optional[LandVerificationRead]:
        """
        Retrieves the latest land verification record for a case.
        Open to any user with legitimate case-level access.
        """
        case = CaseRepository.get_case_by_id(db, case_id)
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case #{case_id} not found.")

        enforce_jurisdiction(user, district_id=case.district_id, state_id=case.state_id)

        record = LandVerificationRepository.get_latest_for_case(db, case_id)
        if not record:
            return None
        return cls._to_read(db, record)

    @classmethod
    def list_tehsildar_queue(
        cls,
        db: Session,
        tehsildar_user: User
    ) -> List[LandVerificationRead]:
        """
        Lists pending submitted verification records awaiting Tehsildar certification in assigned tehsil.
        """
        if tehsildar_user.role != UserRole.TEHSILDAR.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only Tehsildar can access the certification queue."
            )

        tehsil = tehsildar_user.jurisdiction_value if tehsildar_user.jurisdiction_level == JurisdictionLevel.TEHSIL.value else None
        records = LandVerificationRepository.list_pending_for_tehsil(
            db=db,
            tehsil=tehsil,
            status=LandVerificationStatus.SUBMITTED.value
        )
        return [cls._to_read(db, r) for r in records]
