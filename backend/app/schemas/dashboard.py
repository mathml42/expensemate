from datetime import datetime

from pydantic import BaseModel
from decimal import Decimal
from app.models.transaction import TransactionStatus
from app.schemas.user import UserRead

class UserBalance(BaseModel):
    user: UserRead
    balance: Decimal

class RecentActivity(BaseModel):
    id: int
    action: str
    reason: str | None = None
    details: dict | None = None
    timestamp: datetime
    performed_by: UserRead

    model_config = {"from_attributes": True}

class DashboardData(BaseModel):
    net_balance: Decimal
    total_to_receive: Decimal
    total_to_pay: Decimal
    user_balances: list[UserBalance]
    recent_activity: list[RecentActivity]
    pending_approval_count: int
