from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
import logging

from models.user import User, UserUpdate, Child, ChildCreate, ChildUpdate
from services.auth_service import AuthService
from database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["Users"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return payload


@router.get("/profile")
async def get_user_profile(token_payload: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user = await db.find_one("users", {"_id": token_payload["user_id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get children count
        children = await db.find_children_by_user(token_payload["user_id"])
        
        user_response = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "Basic"),
            "avatar": user.get("avatar"),
            "join_date": user.get("join_date"),
            "is_active": user.get("is_active", True),
            "children_count": len(children)
        }
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.put("/profile")
async def update_user_profile(
    user_update: UserUpdate,
    token_payload: dict = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        # Prepare update data (only include non-None fields)
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.avatar is not None:
            update_data["avatar"] = user_update.avatar
        if user_update.subscription is not None:
            update_data["subscription"] = user_update.subscription.value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update user
        success = await db.update_one(
            "users",
            {"_id": token_payload["user_id"]},
            update_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or no changes made"
            )
        
        # Return updated user
        updated_user = await db.find_one("users", {"_id": token_payload["user_id"]})
        user_response = {
            "id": updated_user["_id"],
            "email": updated_user["email"],
            "name": updated_user["name"],
            "subscription": updated_user.get("subscription", "Basic"),
            "avatar": updated_user.get("avatar"),
            "join_date": updated_user.get("join_date"),
            "is_active": updated_user.get("is_active", True)
        }
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.get("/children", response_model=List[Child])
async def get_user_children(token_payload: dict = Depends(get_current_user)):
    """Get all children belonging to the current user"""
    try:
        children = await db.find_children_by_user(token_payload["user_id"])
        return children
        
    except Exception as e:
        logger.error(f"Get children error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get children"
        )


@router.post("/children", response_model=Child, status_code=status.HTTP_201_CREATED)
async def add_child(
    child_data: ChildCreate,
    token_payload: dict = Depends(get_current_user)
):
    """Add a new child to the current user"""
    try:
        # Check if device is already registered
        existing_child = await db.find_one(
            "children",
            {"device_id": child_data.device_id}
        )
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device already registered"
            )
        
        # Create child document
        child_dict = {
            "user_id": token_payload["user_id"],
            "name": child_data.name,
            "age": child_data.age,
            "avatar": child_data.avatar,
            "device": child_data.device,
            "device_id": child_data.device_id,
            "status": "offline"
        }
        
        # Insert child into database
        child_id = await db.create_one("children", child_dict)
        if not child_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add child"
            )
        
        # Return created child
        created_child = await db.find_one("children", {"_id": child_id})
        return created_child
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add child error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add child"
        )


@router.get("/children/{child_id}", response_model=Child)
async def get_child(
    child_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Get specific child information"""
    try:
        child = await db.find_one(
            "children",
            {"_id": child_id, "user_id": token_payload["user_id"]}
        )
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        return child
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get child error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get child"
        )


@router.put("/children/{child_id}", response_model=Child)
async def update_child(
    child_id: str,
    child_update: ChildUpdate,
    token_payload: dict = Depends(get_current_user)
):
    """Update child information"""
    try:
        # Verify child belongs to user
        child = await db.find_one(
            "children",
            {"_id": child_id, "user_id": token_payload["user_id"]}
        )
        
        if not child:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        # Prepare update data
        update_data = {}
        if child_update.name is not None:
            update_data["name"] = child_update.name
        if child_update.age is not None:
            update_data["age"] = child_update.age
        if child_update.avatar is not None:
            update_data["avatar"] = child_update.avatar
        if child_update.device is not None:
            update_data["device"] = child_update.device
        if child_update.status is not None:
            update_data["status"] = child_update.status
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update child
        success = await db.update_one(
            "children",
            {"_id": child_id, "user_id": token_payload["user_id"]},
            update_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found or no changes made"
            )
        
        # Return updated child
        updated_child = await db.find_one("children", {"_id": child_id})
        return updated_child
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update child error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update child"
        )


@router.delete("/children/{child_id}")
async def remove_child(
    child_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Remove a child from the current user"""
    try:
        # Verify child belongs to user and delete
        success = await db.delete_one(
            "children",
            {"_id": child_id, "user_id": token_payload["user_id"]}
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Child not found"
            )
        
        # Also delete all monitoring data for this child
        collections_to_clean = [
            "call_logs", "messages", "locations", "app_usage",
            "web_history", "alerts", "geofences", "contacts", "control_settings"
        ]
        
        for collection in collections_to_clean:
            await db.db[collection].delete_many({"child_id": child_id})
        
        return {"message": "Child removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Remove child error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove child"
        )