from fastapi import APIRouter, Depends, HTTPException
from logic import APP_SETTINGS
from models import Employee, RoleEnum
from auth import require_role

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/")
def get_settings():
    return APP_SETTINGS

@router.post("/")
def update_settings(settings: dict, current_user: Employee = Depends(require_role([RoleEnum.Admin]))):
    # Retrieve weights (with current values as fallback if not in update payload)
    w_env = settings.get("w_env", APP_SETTINGS.get("w_env", 0.4))
    w_social = settings.get("w_social", APP_SETTINGS.get("w_social", 0.3))
    w_gov = settings.get("w_gov", APP_SETTINGS.get("w_gov", 0.3))
    
    # Enforce strict 100% (1.0) weight validation
    if abs((w_env + w_social + w_gov) - 1.0) > 0.001:
        raise HTTPException(
            status_code=400, 
            detail=f"Configuration rejected: ESG weights must sum to exactly 100% (1.0). Current sum: {round((w_env + w_social + w_gov) * 100, 1)}%"
        )
        
    for k, v in settings.items():
        if k in APP_SETTINGS:
            APP_SETTINGS[k] = v
    return APP_SETTINGS
