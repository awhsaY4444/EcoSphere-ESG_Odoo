from fastapi import APIRouter, Depends
from logic import APP_SETTINGS
from models import Employee, RoleEnum
from auth import require_role

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
def get_settings():
    return APP_SETTINGS

@router.post("/")
def update_settings(settings: dict, current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    for k, v in settings.items():
        if k in APP_SETTINGS:
            APP_SETTINGS[k] = v
    return APP_SETTINGS
