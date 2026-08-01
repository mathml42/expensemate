from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import User
from app.schemas import DashboardData
from app.services import dashboard_service

router = APIRouter()


@router.get("/", response_model=DashboardData)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    return dashboard_service.get_dashboard_data(db, user=current_user)
