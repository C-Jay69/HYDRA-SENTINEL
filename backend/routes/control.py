from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
import logging

from models.monitoring import ControlSettings, Geofence
from services.auth_service import JWTBearer
from database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/control", tags=["Control"])
jwt_bearer = JWTBearer()


class AppControlRequest(BaseModel):
    package_name: str
    blocked: bool
    time_limit: Optional[str] = None  # Format: HH:MM:SS


class WebsiteBlockRequest(BaseModel):
    domain: str
    blocked: bool


class GeofenceRequest(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius: int
    type: str  # safe, restricted
    active: bool = True
    notifications: bool = True


async def verify_child_ownership(child_id: str, user_id: str):
    """Verify that the child belongs to the user"""
    child = await db.find_one("children", {"_id": child_id, "user_id": user_id})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child not found or access denied"
        )
    return child


@router.get("/{child_id}/settings")
async def get_control_settings(
    child_id: str,
    token_payload: dict = Depends(jwt_bearer)
):
    """Get control settings for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        settings = await db.find_one("control_settings", {"child_id": child_id})
        
        if not settings:
            # Create default settings if not exists
            default_settings = {
                "child_id": child_id,
                "app_time_limits": {},
                "blocked_apps": [],
                "blocked_websites": [],
                "bedtime_restrictions": None,
                "safe_search_enabled": True,
                "location_tracking_enabled": True
            }
            
            settings_id = await db.create_one("control_settings", default_settings)
            settings = await db.find_one("control_settings", {"_id": settings_id})
        
        return settings
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get control settings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get control settings"
        )


@router.post("/{child_id}/block-app")
async def control_app(
    child_id: str,
    app_control: AppControlRequest,
    token_payload: dict = Depends(jwt_bearer)
):
    """Block or unblock an app for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        # Get current settings
        settings = await db.find_one("control_settings", {"child_id": child_id})
        
        if not settings:
            # Create default settings
            settings = {
                "child_id": child_id,
                "app_time_limits": {},
                "blocked_apps": [],
                "blocked_websites": [],
                "bedtime_restrictions": None,
                "safe_search_enabled": True,
                "location_tracking_enabled": True
            }
            settings_id = await db.create_one("control_settings", settings)
            settings["_id"] = settings_id
        
        # Update blocked apps list
        blocked_apps = settings.get("blocked_apps", [])
        app_time_limits = settings.get("app_time_limits", {})
        
        if app_control.blocked:
            if app_control.package_name not in blocked_apps:
                blocked_apps.append(app_control.package_name)
        else:
            if app_control.package_name in blocked_apps:
                blocked_apps.remove(app_control.package_name)
        
        # Update time limits if provided
        if app_control.time_limit:
            app_time_limits[app_control.package_name] = app_control.time_limit
        
        # Update settings in database
        await db.update_one(
            "control_settings",
            {"child_id": child_id},
            {
                "blocked_apps": blocked_apps,
                "app_time_limits": app_time_limits
            }
        )
        
        # Also update the app_usage collection
        await db.update_one(
            "app_usage",
            {"child_id": child_id, "package_name": app_control.package_name},
            {
                "blocked": app_control.blocked,
                "time_limit": app_control.time_limit
            }
        )
        
        action = "blocked" if app_control.blocked else "unblocked"
        return {"message": f"App {app_control.package_name} {action} successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Control app error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to control app"
        )


@router.post("/{child_id}/block-website")
async def control_website(
    child_id: str,
    website_control: WebsiteBlockRequest,
    token_payload: dict = Depends(jwt_bearer)
):
    """Block or unblock a website for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        # Get current settings
        settings = await db.find_one("control_settings", {"child_id": child_id})
        
        if not settings:
            # Create default settings
            settings = {
                "child_id": child_id,
                "app_time_limits": {},
                "blocked_apps": [],
                "blocked_websites": [],
                "bedtime_restrictions": None,
                "safe_search_enabled": True,
                "location_tracking_enabled": True
            }
            settings_id = await db.create_one("control_settings", settings)
            settings["_id"] = settings_id
        
        # Update blocked websites list
        blocked_websites = settings.get("blocked_websites", [])
        
        if website_control.blocked:
            if website_control.domain not in blocked_websites:
                blocked_websites.append(website_control.domain)
        else:
            if website_control.domain in blocked_websites:
                blocked_websites.remove(website_control.domain)
        
        # Update settings in database
        await db.update_one(
            "control_settings",
            {"child_id": child_id},
            {"blocked_websites": blocked_websites}
        )
        
        action = "blocked" if website_control.blocked else "unblocked"
        return {"message": f"Website {website_control.domain} {action} successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Control website error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to control website"
        )


@router.post("/{child_id}/geofence")
async def create_geofence(
    child_id: str,
    geofence_data: GeofenceRequest,
    token_payload: dict = Depends(jwt_bearer)
):
    """Create or update a geofence for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        # Check if geofence with same name exists
        existing_geofence = await db.find_one(
            "geofences",
            {"child_id": child_id, "name": geofence_data.name}
        )
        
        geofence_dict = {
            "child_id": child_id,
            "name": geofence_data.name,
            "latitude": geofence_data.latitude,
            "longitude": geofence_data.longitude,
            "radius": geofence_data.radius,
            "type": geofence_data.type,
            "active": geofence_data.active,
            "notifications": geofence_data.notifications
        }
        
        if existing_geofence:
            # Update existing geofence
            await db.update_one(
                "geofences",
                {"_id": existing_geofence["_id"]},
                geofence_dict
            )
            return {"message": f"Geofence {geofence_data.name} updated successfully"}
        else:
            # Create new geofence
            geofence_id = await db.create_one("geofences", geofence_dict)
            return {
                "message": f"Geofence {geofence_data.name} created successfully",
                "geofence_id": geofence_id
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create geofence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create geofence"
        )


@router.put("/{child_id}/settings")
async def update_control_settings(
    child_id: str,
    settings_update: dict,
    token_payload: dict = Depends(jwt_bearer)
):
    """Update control settings for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        # Get current settings
        settings = await db.find_one("control_settings", {"child_id": child_id})
        
        if not settings:
            # Create default settings first
            default_settings = {
                "child_id": child_id,
                "app_time_limits": {},
                "blocked_apps": [],
                "blocked_websites": [],
                "bedtime_restrictions": None,
                "safe_search_enabled": True,
                "location_tracking_enabled": True
            }
            settings_id = await db.create_one("control_settings", default_settings)
            settings = await db.find_one("control_settings", {"_id": settings_id})
        
        # Validate and update allowed fields
        allowed_fields = [
            "bedtime_restrictions", "safe_search_enabled", 
            "location_tracking_enabled", "app_time_limits",
            "blocked_apps", "blocked_websites"
        ]
        
        update_data = {}
        for field, value in settings_update.items():
            if field in allowed_fields:
                update_data[field] = value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update settings in database
        success = await db.update_one(
            "control_settings",
            {"child_id": child_id},
            update_data
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update settings"
            )
        
        return {"message": "Control settings updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update control settings error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update control settings"
        )


@router.delete("/{child_id}/geofence/{geofence_id}")
async def delete_geofence(
    child_id: str,
    geofence_id: str,
    token_payload: dict = Depends(jwt_bearer)
):
    """Delete a geofence for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        success = await db.delete_one(
            "geofences",
            {"_id": geofence_id, "child_id": child_id}
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Geofence not found"
            )
        
        return {"message": "Geofence deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete geofence error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete geofence"
        )