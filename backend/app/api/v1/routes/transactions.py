from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models import Transaction, User
from app.models.transaction import TransactionStatus
from app.schemas import (
    TransactionCreate,
    TransactionRead,
    TransactionReject,
    TransactionSoftDelete,
    TransactionUpdate,
)
from app.services import transaction_service

router = APIRouter()


@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_new_transaction(
    transaction_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    try:
        return transaction_service.create_transaction(
            db, transaction_in=transaction_in, user=current_user
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/", response_model=list[TransactionRead])
def get_user_transactions(
    user_id: int | None = None,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    tx_status: TransactionStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    return transaction_service.get_transactions_for_user(
        db,
        user_id=current_user.id,
        other_user_id=user_id,
        note=note,
        amount=amount,
        date_from=date_from,
        date_to=date_to,
        status=tx_status,
    )


@router.get("/all", response_model=list[TransactionRead])
def get_all_transactions(
    user_id: int | None = None,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    tx_status: TransactionStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> list[Transaction]:
    query = db.query(Transaction)
    if user_id is not None:
        query = query.filter(or_(Transaction.paid_by_id == user_id, Transaction.paid_for_id == user_id))
    if note:
        query = query.filter(Transaction.note.ilike(f"%{note}%"))
    if amount is not None:
        query = query.filter(Transaction.amount == amount)
    if date_from is not None:
        query = query.filter(Transaction.date >= date_from)
    if date_to is not None:
        query = query.filter(Transaction.date <= date_to)
    if tx_status is not None:
        query = query.filter(Transaction.status == tx_status)
    return query.order_by(Transaction.date.desc(), Transaction.id.desc()).all()


@router.get("/pending", response_model=list[TransactionRead])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    return db.query(Transaction).filter(
        Transaction.status == TransactionStatus.PENDING,
        Transaction.paid_for_id == current_user.id,
        Transaction.is_deleted == False,
    ).all()


@router.get("/with/{user_id}", response_model=list[TransactionRead])
def get_transactions_with_user(
    user_id: int,
    note: str | None = None,
    amount: float | None = None,
    date_from: date_type | None = None,
    date_to: date_type | None = None,
    tx_status: TransactionStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    return transaction_service.get_transactions_between_users(
        db,
        user1_id=current_user.id,
        user2_id=user_id,
        note=note,
        amount=amount,
        date_from=date_from,
        date_to=date_to,
        status=tx_status,
    )


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction_details(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction or (
        transaction.paid_by_id != current_user.id and transaction.paid_for_id != current_user.id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionRead)
def update_a_transaction(
    transaction_id: int,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction or transaction.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found or you don't have permission to edit")
    
    if transaction.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot edit a deleted transaction")

    return transaction_service.update_transaction(
        db, transaction=transaction, transaction_in=transaction_in, user=current_user
    )


@router.post("/{transaction_id}/approve", response_model=TransactionRead)
def approve_a_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    # Rule 1: Only the OTHER user can approve
    if not transaction or transaction.paid_by_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot approve this transaction")
    
    if transaction.status != TransactionStatus.PENDING:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction is not pending approval")

    return transaction_service.approve_transaction(db, transaction=transaction, user=current_user)


@router.post("/{transaction_id}/reject", response_model=TransactionRead)
def reject_a_transaction(
    transaction_id: int,
    payload: TransactionReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    # Rule 1: Only the OTHER user can reject
    if not transaction or transaction.paid_by_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot reject this transaction")

    if transaction.status != TransactionStatus.PENDING:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction is not pending approval")

    return transaction_service.reject_transaction(
        db, transaction=transaction, reason=payload.reason, user=current_user
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_a_transaction(
    transaction_id: int,
    payload: TransactionSoftDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    if not transaction or transaction.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found or you don't have permission to delete")
    
    if transaction.is_deleted:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction already deleted")

    transaction_service.soft_delete_transaction(
        db, transaction=transaction, reason=payload.reason, user=current_user
    )
