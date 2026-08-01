
from datetime import date as date_type

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Transaction, User
from app.models.transaction import TransactionStatus
from app.schemas import TransactionCreate, TransactionUpdate
from app.services.audit_log_service import create_audit_log


def create_transaction(
    db: Session, *, transaction_in: TransactionCreate, user: User
) -> Transaction:
    if user.id == transaction_in.paid_for_id:
        raise ValueError("Users cannot create transactions with themselves.")

    if transaction_in.i_paid:
        paid_by_id = user.id
        paid_for_id = transaction_in.paid_for_id
    else:
        paid_by_id = transaction_in.paid_for_id
        paid_for_id = user.id

    db_transaction = Transaction(
        amount=transaction_in.amount,
        note=transaction_in.note,
        date=transaction_in.date,
        paid_by_id=paid_by_id,
        paid_for_id=paid_for_id,
        created_by_id=user.id,
        status=TransactionStatus.PENDING,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    create_audit_log(
        db,
        action="CREATE_TRANSACTION",
        performed_by=user,
        details={
            "transaction_id": db_transaction.id,
            "amount": float(db_transaction.amount),
            "paid_by_id": db_transaction.paid_by_id,
            "paid_for_id": db_transaction.paid_for_id,
        },
    )

    return db_transaction


def get_transaction_by_id(db: Session, transaction_id: int) -> Transaction | None:
    return db.get(Transaction, transaction_id)


def _apply_transaction_filters(
    query,
    *,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    status: TransactionStatus | None = None,
):
    if note:
        query = query.filter(Transaction.note.ilike(f"%{note}%"))
    if amount is not None:
        query = query.filter(Transaction.amount == amount)
    if date_from is not None:
        query = query.filter(Transaction.date >= date_from)
    if date_to is not None:
        query = query.filter(Transaction.date <= date_to)
    if status is not None:
        query = query.filter(Transaction.status == status)
    return query


def get_transactions_for_user(
    db: Session,
    user_id: int,
    *,
    other_user_id: int | None = None,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    status: TransactionStatus | None = None,
) -> list[Transaction]:
    query = db.query(Transaction).filter(
        (Transaction.paid_by_id == user_id) | (Transaction.paid_for_id == user_id)
    )
    if other_user_id is not None:
        query = query.filter(
            (Transaction.paid_by_id == other_user_id) | (Transaction.paid_for_id == other_user_id)
        )
    query = _apply_transaction_filters(
        query,
        note=note,
        amount=amount,
        date_from=date_from,
        date_to=date_to,
        status=status,
    )
    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()


def get_transactions_between_users(
    db: Session,
    user1_id: int,
    user2_id: int,
    *,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    status: TransactionStatus | None = None,
) -> list[Transaction]:
    query = db.query(Transaction).filter(
        or_(
            (Transaction.paid_by_id == user1_id) & (Transaction.paid_for_id == user2_id),
            (Transaction.paid_by_id == user2_id) & (Transaction.paid_for_id == user1_id)
        )
    )
    query = _apply_transaction_filters(
        query,
        note=note,
        amount=amount,
        date_from=date_from,
        date_to=date_to,
        status=status,
    )
    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()


def update_transaction(
    db: Session,
    *,
    transaction: Transaction,
    transaction_in: TransactionUpdate,
    user: User,
) -> Transaction:
    update_data = transaction_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)

    # Rule 3: Editing an Approved transaction automatically changes its status back to Pending.
    if transaction.status == TransactionStatus.APPROVED:
        transaction.status = TransactionStatus.PENDING

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    create_audit_log(
        db,
        action="UPDATE_TRANSACTION",
        performed_by=user,
        details={"transaction_id": transaction.id, "updated_fields": list(update_data.keys())},
    )
    return transaction


def approve_transaction(
    db: Session, *, transaction: Transaction, user: User
) -> Transaction:
    transaction.status = TransactionStatus.APPROVED
    transaction.rejection_reason = None
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    create_audit_log(
        db,
        action="APPROVE_TRANSACTION",
        performed_by=user,
        details={"transaction_id": transaction.id},
    )
    return transaction


def reject_transaction(
    db: Session, *, transaction: Transaction, reason: str, user: User
) -> Transaction:
    transaction.status = TransactionStatus.REJECTED
    transaction.rejection_reason = reason
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    create_audit_log(
        db,
        action="REJECTE_TRANSACTION",
        performed_by=user,
        reason=reason,
        details={"transaction_id": transaction.id},
    )
    return transaction


def soft_delete_transaction(
    db: Session, *, transaction: Transaction, reason: str, user: User
) -> Transaction:
    transaction.is_deleted = True
    transaction.deletion_reason = reason
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    create_audit_log(
        db,
        action="DELETE_TRANSACTION",
        performed_by=user,
        reason=reason,
        details={"transaction_id": transaction.id},
    )
    return transaction
