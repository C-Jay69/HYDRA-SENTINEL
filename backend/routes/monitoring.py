from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
import uuid

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


# ===== MOBILE APP ENDPOINTS =====
# These endpoints are for the React Native child monitoring app

@router.post("/devices/register")
async def register_device(device_data: Dict[str, Any]):
    """Register a new monitoring device"""
    try:
        # Create device record
        device_id = device_data.get("device_id")
        
        if not device_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device ID is required"
            )
        
        # Check if device already exists
        existing_device = await db.find_one("devices", {"device_id": device_id})
        
        if existing_device:
            # Update existing device
            await db.update_one(
                "devices",
                {"device_id": device_id},
                {
                    "last_seen": datetime.utcnow().isoformat(),
                    "device_info": device_data
                }
            )
            child_id = existing_device.get("child_id")
        else:
            # Create new device and child record
            child_id = str(uuid.uuid4())
            
            device_record = {
                "device_id": device_id,
                "child_id": child_id,
                "device_info": device_data,
                "registered_at": datetime.utcnow().isoformat(),
                "last_seen": datetime.utcnow().isoformat(),
                "status": "active"
            }
            
            await db.insert_one("devices", device_record)
            
            # Create child record (will be linked to parent later)
            child_record = {
                "_id": child_id,
                "name": device_data.get("device_name", "Unknown Device"),
                "device_id": device_id,
                "age": 0,  # Will be updated when linked to parent
                "user_id": None,  # Will be set when parent adds child
                "created_at": datetime.utcnow().isoformat(),
                "monitoring_active": True
            }
            
            await db.insert_one("children", child_record)
        
        return {
            "success": True,
            "child_id": child_id,
            "message": "Device registered successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Device registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register device"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for mobile app"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@router.post("/{child_id}/calls/batch")
async def sync_call_logs_batch(child_id: str, data: Dict[str, Any]):
    """Sync call logs from mobile app"""
    try:
        call_logs = data.get("call_logs", [])
        
        if not call_logs:
            return {"success": True, "synced": 0}
        
        # Process and store call logs
        processed_logs = []
        for call in call_logs:
            call_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "phone_number": call.get("phoneNumber"),
                "name": call.get("name"),
                "timestamp": call.get("timestamp"),
                "duration": call.get("duration", 0),
                "type": call.get("type"),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_logs.append(call_record)
        
        # Bulk insert
        if processed_logs:
            await db.insert_many("call_logs", processed_logs)
        
        return {
            "success": True,
            "synced": len(processed_logs)
        }
        
    except Exception as e:
        logger.error(f"Call logs batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync call logs"
        )


@router.post("/{child_id}/location")
async def sync_location(child_id: str, location_data: Dict[str, Any]):
    """Sync location data from mobile app"""
    try:
        location_record = {
            "_id": str(uuid.uuid4()),
            "child_id": child_id,
            "latitude": location_data.get("latitude"),
            "longitude": location_data.get("longitude"),
            "accuracy": location_data.get("accuracy"),
            "timestamp": location_data.get("timestamp"),
            "speed": location_data.get("speed", 0),
            "heading": location_data.get("heading", 0),
            "synced_at": datetime.utcnow().isoformat()
        }
        
        await db.insert_one("locations", location_record)
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Location sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync location"
        )


@router.post("/{child_id}/apps/batch")
async def sync_app_usage_batch(child_id: str, data: Dict[str, Any]):
    """Sync app usage data from mobile app"""
    try:
        app_usage = data.get("app_usage", [])
        
        if not app_usage:
            return {"success": True, "synced": 0}
        
        # Process and store app usage data
        processed_usage = []
        for app in app_usage:
            usage_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "package_name": app.get("packageName"),
                "app_name": app.get("appName"),
                "total_time": app.get("totalTimeInForeground", 0),
                "first_time": app.get("firstTimeStamp"),
                "last_time": app.get("lastTimeStamp"),
                "last_used": app.get("lastTimeUsed"),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_usage.append(usage_record)
        
        # Bulk insert
        if processed_usage:
            await db.insert_many("app_usage", processed_usage)
        
        return {
            "success": True,
            "synced": len(processed_usage)
        }
        
    except Exception as e:
        logger.error(f"App usage batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync app usage"
        )


@router.post("/{child_id}/contacts/batch")
async def sync_contacts_batch(child_id: str, data: Dict[str, Any]):
    """Sync contacts from mobile app"""
    try:
        contacts = data.get("contacts", [])
        
        if not contacts:
            return {"success": True, "synced": 0}
        
        # Clear existing contacts for this child and insert new ones
        await db.delete_many("contacts", {"child_id": child_id})
        
        # Process and store contacts
        processed_contacts = []
        for contact in contacts:
            contact_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "record_id": contact.get("recordID"),
                "display_name": contact.get("displayName"),
                "given_name": contact.get("givenName"),
                "family_name": contact.get("familyName"),
                "phone_numbers": contact.get("phoneNumbers", []),
                "email_addresses": contact.get("emailAddresses", []),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_contacts.append(contact_record)
        
        # Bulk insert
        if processed_contacts:
            await db.insert_many("contacts", processed_contacts)
        
        return {
            "success": True,
            "synced": len(processed_contacts)
        }
        
    except Exception as e:
        logger.error(f"Contacts batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync contacts"
        )


@router.post("/{child_id}/social-media/batch")
async def sync_social_media_batch(child_id: str, data: Dict[str, Any]):
    """Sync social media activities from mobile app"""
    try:
        activities = data.get("activities", [])
        
        if not activities:
            return {"success": True, "synced": 0}
        
        # Process and store social media activities
        processed_activities = []
        for activity in activities:
            activity_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "app": activity.get("app"),
                "package_name": activity.get("packageName"),
                "event_type": activity.get("eventType"),
                "content": activity.get("content", {}),
                "timestamp": activity.get("timestamp"),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_activities.append(activity_record)
        
        # Bulk insert
        if processed_activities:
            await db.insert_many("social_media_activities", processed_activities)
        
        return {
            "success": True,
            "synced": len(processed_activities)
        }
        
    except Exception as e:
        logger.error(f"Social media batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync social media activities"
        )


@router.post("/{child_id}/status")
async def update_device_status(child_id: str, status_data: Dict[str, Any]):
    """Update device status from mobile app"""
    try:
        # Update device status
        await db.update_one(
            "devices",
            {"child_id": child_id},
            {
                "last_seen": datetime.utcnow().isoformat(),
                "status": status_data.get("status", "active"),
                "battery_level": status_data.get("batteryLevel"),
                "is_charging": status_data.get("isCharging"),
                "monitoring_status": status_data.get("monitoringStatus", {})
            }
        )
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Device status update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update device status"
        )


@router.post("/{child_id}/alerts")
async def create_alert_from_mobile(child_id: str, alert_data: Dict[str, Any]):
    """Create alert from mobile app"""
    try:
        alert_record = {
            "_id": str(uuid.uuid4()),
            "child_id": child_id,
            "type": alert_data.get("type"),
            "message": alert_data.get("message", ""),
            "data": alert_data.get("data", {}),
            "severity": alert_data.get("severity", "medium"),
            "timestamp": alert_data.get("timestamp", datetime.utcnow().isoformat()),
            "read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.insert_one("alerts", alert_record)
        
        return {"success": True, "alert_id": alert_record["_id"]}
        
    except Exception as e:
        logger.error(f"Create alert from mobile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create alert"
        )


@router.post("/{child_id}/control-events/batch")
async def sync_control_events_batch(child_id: str, data: Dict[str, Any]):
    """Sync parental control events from mobile app"""
    try:
        events = data.get("events", [])
        
        if not events:
            return {"success": True, "synced": 0}
        
        # Process and store control events
        processed_events = []
        for event in events:
            event_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "event_type": event.get("eventType"),
                "package_name": event.get("packageName"),
                "reason": event.get("reason"),
                "timestamp": event.get("timestamp"),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_events.append(event_record)
        
        # Bulk insert
        if processed_events:
            await db.insert_many("control_events", processed_events)
        
        return {
            "success": True,
            "synced": len(processed_events)
        }
        
    except Exception as e:
        logger.error(f"Control events batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync control events"
        )


@router.post("/{child_id}/security-events/batch")
async def sync_security_events_batch(child_id: str, data: Dict[str, Any]):
    """Sync security/tamper events from mobile app"""
    try:
        events = data.get("events", [])
        
        if not events:
            return {"success": True, "synced": 0}
        
        # Process and store security events
        processed_events = []
        for event in events:
            event_record = {
                "_id": str(uuid.uuid4()),
                "child_id": child_id,
                "type": event.get("type"),
                "details": event.get("details", {}),
                "severity": event.get("severity"),
                "timestamp": event.get("timestamp"),
                "device_info": event.get("deviceInfo", {}),
                "synced_at": datetime.utcnow().isoformat()
            }
            processed_events.append(event_record)
        
        # Bulk insert
        if processed_events:
            await db.insert_many("security_events", processed_events)
        
        return {
            "success": True,
            "synced": len(processed_events)
        }
        
    except Exception as e:
        logger.error(f"Security events batch sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync security events"
        )


@router.get("/devices/{device_id}/updates")
async def get_device_updates(device_id: str, since: Optional[str] = Query(None)):
    """Get configuration updates for mobile device"""
    try:
        # This would return any configuration changes or remote commands
        # for the mobile app to process
        
        updates = []
        
        # Check for pending commands in a commands collection
        # This is where parents can send remote commands like app blocking
        commands = await db.find_many(
            "device_commands",
            {
                "device_id": device_id,
                "status": "pending",
                "created_at": {"$gte": since} if since else {}
            }
        )
        
        for command in commands:
            updates.append({
                "id": command.get("_id"),
                "type": command.get("type"),
                "data": command.get("data", {}),
                "timestamp": command.get("created_at")
            })
        
        return {
            "success": True,
            "updates": updates
        }
        
    except Exception as e:
        logger.error(f"Get device updates error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get device updates"
        )