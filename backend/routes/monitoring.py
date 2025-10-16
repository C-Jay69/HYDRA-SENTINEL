from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from typing import List, Optional, Dict, Any
import logging
import json
from datetime import datetime
import uuid

from models.monitoring import (
    CallLog, Message, Location, AppUsage, WebHistory, 
    Alert, Geofence, Contact, ControlSettings, SocialMediaActivity,
    ScreenTimeSchedule
)
from database import db
from auth_deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/monitoring", tags=["Monitoring"])

async def verify_child_ownership(child_id: str, user_id: str):
    child = await db.find_one("children", {"_id": child_id, "user_id": user_id})
    if not child:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Child not found or access denied")
    return child

# --- Control Settings & Screen Time Schedules ---

@router.get("/{child_id}/settings", response_model=ControlSettings)
async def get_control_settings(child_id: str, token_payload: dict = Depends(get_current_user)):
    await verify_child_ownership(child_id, token_payload["user_id"])
    settings = await db.find_one("control_settings", {"child_id": child_id})
    if not settings:
        # Create default settings if they don't exist
        default_settings = ControlSettings(child_id=child_id)
        await db.insert_one("control_settings", default_settings.dict())
        return default_settings
    return settings

@router.post("/{child_id}/schedules", response_model=ScreenTimeSchedule)
async def add_schedule(
    child_id: str, 
    schedule: ScreenTimeSchedule, 
    token_payload: dict = Depends(get_current_user)
):
    await verify_child_ownership(child_id, token_payload["user_id"])
    await db.push_to_array(
        "control_settings", 
        {"child_id": child_id}, 
        "screen_time_schedules", 
        schedule.dict()
    )
    return schedule

@router.put("/{child_id}/schedules/{schedule_id}", response_model=ScreenTimeSchedule)
async def update_schedule(
    child_id: str, 
    schedule_id: str, 
    schedule_update: ScreenTimeSchedule, 
    token_payload: dict = Depends(get_current_user)
):
    await verify_child_ownership(child_id, token_payload["user_id"])
    # To update an element in an array, we pull it and then push the new version.
    await db.pull_from_array(
        "control_settings",
        {"child_id": child_id},
        "screen_time_schedules",
        {"id": schedule_id}
    )
    await db.push_to_array(
        "control_settings",
        {"child_id": child_id},
        "screen_time_schedules",
        schedule_update.dict()
    )
    return schedule_update

@router.delete("/{child_id}/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(child_id: str, schedule_id: str, token_payload: dict = Depends(get_current_user)):
    await verify_child_ownership(child_id, token_payload["user_id"])
    await db.pull_from_array(
        "control_settings",
        {"child_id": child_id},
        "screen_time_schedules",
        {"id": schedule_id}
    )
    return

# --- Existing GET Endpoints & Mobile Sync ---

# (The rest of the file remains the same...)
