from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
import logging
from datetime import datetime

from models.monitoring import (
    CallLog, Message, Location, AppUsage, WebHistory, 
    Alert, Geofence, Contact, ControlSettings
)
from database import db
from auth_deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])


async def verify_child_ownership(child_id: str, user_id: str):
    """Verify that the child belongs to the user"""
    from bson import ObjectId
    
    # Try both string and ObjectId formats for child_id and user_id
    child = await db.find_one("children", {"_id": child_id, "user_id": user_id})
    if not child:
        try:
            # Try with ObjectId
            child = await db.find_one("children", {"_id": ObjectId(child_id), "user_id": user_id})
        except:
            pass
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Child not found or access denied"
        )
    return child


@router.get("/{child_id}/calls", response_model=List[CallLog])
async def get_call_logs(
    child_id: str,
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get call logs for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        calls = await db.find_child_data("call_logs", child_id, limit)
        return calls
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get call logs error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get call logs"
        )


@router.get("/{child_id}/messages", response_model=List[Message])
async def get_messages(
    child_id: str,
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get messages for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        messages = await db.find_child_data("messages", child_id, limit)
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get messages"
        )


@router.get("/{child_id}/locations", response_model=List[Location])
async def get_locations(
    child_id: str,
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get location history for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        locations = await db.find_child_data("locations", child_id, limit)
        return locations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get locations error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location history"
        )


@router.get("/{child_id}/apps", response_model=List[AppUsage])
async def get_app_usage(
    child_id: str,
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get app usage data for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        apps = await db.find_child_data("app_usage", child_id, limit)
        return apps
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get app usage error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get app usage data"
        )


@router.get("/{child_id}/web", response_model=List[WebHistory])
async def get_web_history(
    child_id: str,
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get web browsing history for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        web_history = await db.find_child_data("web_history", child_id, limit)
        return web_history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get web history error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get web history"
        )


@router.get("/{child_id}/alerts", response_model=List[Alert])
async def get_alerts(
    child_id: str,
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    token_payload: dict = Depends(get_current_user)
):
    """Get alerts for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        filter_dict = {"child_id": child_id}
        if unread_only:
            filter_dict["read"] = False
        
        alerts = await db.find_many(
            "alerts",
            filter_dict,
            limit=limit,
            sort=[("timestamp", -1)]
        )
        return alerts
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get alerts error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get alerts"
        )


@router.post("/{child_id}/alerts/{alert_id}/read")
async def mark_alert_as_read(
    child_id: str,
    alert_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Mark an alert as read"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        success = await db.update_one(
            "alerts",
            {"_id": alert_id, "child_id": child_id},
            {"read": True}
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        return {"message": "Alert marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark alert read error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark alert as read"
        )


@router.delete("/{child_id}/alerts/{alert_id}")
async def dismiss_alert(
    child_id: str,
    alert_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Dismiss (delete) an alert"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        success = await db.delete_one(
            "alerts",
            {"_id": alert_id, "child_id": child_id}
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        return {"message": "Alert dismissed"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dismiss alert error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dismiss alert"
        )


@router.get("/{child_id}/geofences", response_model=List[Geofence])
async def get_geofences(
    child_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Get geofences for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        geofences = await db.find_many("geofences", {"child_id": child_id})
        return geofences
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get geofences error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get geofences"
        )


@router.get("/{child_id}/contacts", response_model=List[Contact])
async def get_contacts(
    child_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Get contacts for a specific child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        contacts = await db.find_many("contacts", {"child_id": child_id})
        return contacts
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get contacts error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get contacts"
        )


@router.get("/{child_id}/summary")
async def get_child_summary(
    child_id: str,
    token_payload: dict = Depends(get_current_user)
):
    """Get summary statistics for a child"""
    try:
        await verify_child_ownership(child_id, token_payload["user_id"])
        
        # Get counts for different data types
        calls_today = await db.count_documents(
            "call_logs",
            {
                "child_id": child_id,
                "timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
            }
        )
        
        messages_today = await db.count_documents(
            "messages",
            {
                "child_id": child_id,
                "timestamp": {"$gte": datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)}
            }
        )
        
        active_apps = await db.count_documents(
            "app_usage",
            {"child_id": child_id, "blocked": False}
        )
        
        unread_alerts = await db.count_documents(
            "alerts",
            {"child_id": child_id, "read": False}
        )
        
        return {
            "calls_today": calls_today,
            "messages_today": messages_today,
            "active_apps": active_apps,
            "unread_alerts": unread_alerts
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get child summary error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get child summary"
        )