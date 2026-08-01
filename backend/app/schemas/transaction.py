from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.transaction import TransactionStatus
from app.schemas.user import UserRead


class TransactionBase(BaseModel):
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    note: str = Field(..., min_length=1, max_length=255)
    date: date_type


class TransactionCreate(BaseModel):
    paid_for_id: int
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    note: str = Field(..., min_length=1, max_length=255)
    date: date_type
    # Direction is handled in the API logic based on who the user picks
    # 'I paid for them' or 'They paid for me'
    i_paid: bool


class TransactionUpdate(BaseModel):
    amount: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)
    note: str | None = Field(None, min_length=1, max_length=255)
    date: date_type | None = None


class TransactionRead(TransactionBase):
    id: int
    status: TransactionStatus
    rejection_reason: str | None = None
    is_deleted: bool
    deletion_reason: str | None = None

    paid_by_id: int
    paid_for_id: int
    created_by_id: int

    paid_by: UserRead
    paid_for: UserRead
    created_by: UserRead

    model_config = {"from_attributes": True}


class TransactionReject(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)


class TransactionSoftDelete(BaseModel):
    reason: str = Field(..., min_length=1, max_length=500)
