# ==============================================================================
# Layer: Repositories — Immutable Statutory Audit Trail (app/repositories/audit_repo.py)
# DESIGN CONSTRAINT & ALLOWED:
#   - Append-only repository operations: insert audit record, fetch audit trail for case,
#     and flag an existing entry for supervisory review.
# NOT ALLOWED:
#   - ABSOLUTELY NO generic update methods (update_audit_log, edit_entry, etc.).
#   - ABSOLUTELY NO delete methods (delete_audit_log, purge_logs, etc.), not even for admins.
#   - The only permissible mutation is flag_audit_entry, which strictly sets 'flagged' and
#     'flagged_by_user_id', leaving actor, action, remarks, and timestamps entirely untouched.
# ==============================================================================

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.models.audit import AuditLog


class AuditRepository:
    """
    Append-only repository for the statutory audit trail.
    Guarantees immutability by strictly omitting any update or delete operations.
    """

    @staticmethod
    def create_audit_entry(
        db: Session,
        case_id: int,
        actor_user_id: int,
        action: str,
        remarks: Optional[str] = None
    ) -> AuditLog:
        """Insert an immutable statutory audit log entry."""
        entry = AuditLog(
            case_id=case_id,
            actor_user_id=actor_user_id,
            action=action,
            remarks=remarks,
            created_at=datetime.now(timezone.utc),
            flagged=False,
            flagged_by_user_id=None
        )
        db.add(entry)
        db.flush()
        return entry

    @staticmethod
    def get_audit_logs_for_case(db: Session, case_id: int) -> List[AuditLog]:
        """Fetch chronological audit history for an acquisition case."""
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.actor), selectinload(AuditLog.flagged_by))
            .where(AuditLog.case_id == case_id)
            .order_by(AuditLog.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_audit_entry_by_id(db: Session, entry_id: int) -> Optional[AuditLog]:
        return db.get(AuditLog, entry_id)

    @staticmethod
    def flag_audit_entry(
        db: Session,
        entry_id: int,
        flagged_by_user_id: int
    ) -> Optional[AuditLog]:
        """
        The ONLY permitted mutation on an existing audit row.
        Modifies strictly 'flagged' and 'flagged_by_user_id'.
        Actor, action, remarks, and created_at timestamps remain strictly untouched.
        """
        entry = db.get(AuditLog, entry_id)
        if not entry:
            return None
        entry.flagged = True
        entry.flagged_by_user_id = flagged_by_user_id
        db.flush()
        return entry
