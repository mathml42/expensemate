from datetime import datetime

from pydantic import BaseModel

from app.schemas.user import UserRead


class AuditLogRead(BaseModel):
    id: int
    action: str
    reason: str | None = None
    details: dict | None = None
    timestamp: datetime
    performed_by: UserRead

    model_config = {"from_attributes": True}
