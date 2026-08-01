from sqlalchemy.orm import Session

from app.models import AuditLog, User


def create_audit_log(
    db: Session,
    *,
    action: str,
    performed_by: User,
    reason: str | None = None,
    details: dict | None = None,
) -> AuditLog:
    db_log = AuditLog(
        action=action,
        performed_by_id=performed_by.id,
        reason=reason,
        details=details,
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
