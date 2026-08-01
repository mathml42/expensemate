
from decimal import Decimal
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from app.models import AuditLog, Transaction, User
from app.models.transaction import TransactionStatus

def get_dashboard_data(db: Session, user: User) -> dict:
    
    approved_transactions = select(Transaction).where(
        (Transaction.paid_by_id == user.id) | (Transaction.paid_for_id == user.id),
        Transaction.status == TransactionStatus.APPROVED,
        Transaction.is_deleted == False
    )
    
    transactions = db.scalars(approved_transactions).all()

    total_to_receive = Decimal(0)
    total_to_pay = Decimal(0)
    
    # Calculate balances with each user
    balances = defaultdict(Decimal)

    for t in transactions:
        if t.paid_by_id == user.id:
            # User paid for someone else (they owe the user)
            balances[t.paid_for_id] += t.amount
            total_to_receive += t.amount
        else:
            # Someone else paid for the user (user owes them)
            balances[t.paid_by_id] -= t.amount
            total_to_pay += t.amount

    net_balance = total_to_receive - total_to_pay

    # Prepare user balance details
    user_balances = []
    all_user_ids = set(balances.keys())
    
    all_users_q = db.scalars(select(User).where(User.id.in_(all_user_ids))).all()
    user_map = {u.id: u for u in all_users_q}

    for user_id, balance in balances.items():
        user_info = user_map.get(user_id)
        if user_info:
            user_balances.append({
                "user": user_info,
                "balance": balance
            })

    recent_activity = db.scalars(
        select(AuditLog)
        .where(
            or_(
                AuditLog.performed_by_id == user.id,
                AuditLog.details["paid_by_id"].as_integer() == user.id,
                AuditLog.details["paid_for_id"].as_integer() == user.id,
            )
        )
        .order_by(AuditLog.timestamp.desc())
        .limit(5)
    ).all()

    pending_approval_count = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.PENDING,
        Transaction.paid_for_id == user.id,
        Transaction.is_deleted == False,
    ).count()

    return {
        "net_balance": net_balance,
        "total_to_receive": total_to_receive,
        "total_to_pay": total_to_pay,
        "user_balances": user_balances,
        "recent_activity": recent_activity,
        "pending_approval_count": pending_approval_count,
    }
