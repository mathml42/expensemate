from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.transaction import Transaction


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships to Transaction model
    transactions_paid_by: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        foreign_keys="[Transaction.paid_by_id]",
        back_populates="paid_by",
    )
    transactions_paid_for: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        foreign_keys="[Transaction.paid_for_id]",
        back_populates="paid_for",
    )
    transactions_created: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        foreign_keys="[Transaction.created_by_id]",
        back_populates="created_by",
    )

    # Relationship to AuditLog model
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        foreign_keys="[AuditLog.performed_by_id]",
        back_populates="performed_by",
    )
