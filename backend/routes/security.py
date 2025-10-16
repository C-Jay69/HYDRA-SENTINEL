
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from database import db
from auth_deps import get_current_user

router = APIRouter(prefix="/api/security", tags=["Security"])

# Dependency to verify admin user
async def verify_admin_user(token_payload: dict = Depends(get_current_user)):
    user = await db.find_one("users", {"_id": token_payload.get("user_id")})
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges are required for this action.",
        )
    return user

@router.get("/logs", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_user)])
async def get_security_logs():
    """Fetches security logs from the database."""
    logs_cursor = await db.find("security_logs", {})
    logs = [log for log in logs_cursor]
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
