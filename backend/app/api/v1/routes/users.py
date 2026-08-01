from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models import User
from app.schemas import user as user_schema
from app.services import user_service
from app.services.audit_log_service import create_audit_log

router = APIRouter()


@router.post("/", response_model=user_schema.UserRead, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: user_schema.UserCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> User:
    existing_user = user_service.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    user = user_service.create_user(db, user_in)
    create_audit_log(
        db,
        action="CREATE_USER",
        performed_by=admin_user,
        details={"user_id": user.id, "email": user.email},
    )
    return user


@router.get("/", response_model=list[user_schema.UserRead])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[User]:
    users = user_service.get_users(db, skip=skip, limit=limit)
    if current_user.role == "admin":
        return users
    return [user for user in users if user.id != current_user.id and user.is_active]


@router.get("/{user_id}", response_model=user_schema.UserRead)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=user_schema.UserRead)
def update_existing_user(
    user_id: int,
    user_in: user_schema.UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> User:
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user_in.email:
        existing_user = user_service.get_user_by_email(db, user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            )

    updated_user = user_service.update_user(db, user, user_in)
    action = "UPDATE_USER"
    if user_in.is_active is not None:
        action = "ACTIVATE_USER" if user_in.is_active else "DEACTIVATE_USER"
    create_audit_log(
        db,
        action=action,
        performed_by=admin_user,
        details={"user_id": updated_user.id, "updated_fields": list(user_in.model_dump(exclude_unset=True).keys())},
    )
    return updated_user


@router.post("/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_user_password_by_admin(
    user_id: int,
    payload: user_schema.AdminPasswordReset,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> None:
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user_service.admin_reset_user_password(db, user, payload.new_password)
    create_audit_log(
        db,
        action="RESET_USER_PASSWORD",
        performed_by=admin_user,
        details={"user_id": user.id, "email": user.email},
    )
