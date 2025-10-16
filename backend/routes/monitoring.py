from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from typing import List, Optional, Dict, Any
import logging
import json
from datetime import datetime, timedelta
import uuid
import random

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

@router.get("/{child_id}/web-history", response_model=List[WebHistory])
async def get_web_history(
    child_id: str,
    token_payload: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    filter: Optional[str] = Query(None, description="Filter by domain or title")
):
    """
    Retrieves web browsing history for a specific child, with pagination.
    A mock implementation that generates plausible web history data.
    """
    await verify_child_ownership(child_id, token_payload["user_id"])

    # Mock data generation
    history_items = []
    domains = ["youtube.com", "tiktok.com", "roblox.com", "netflix.com", "google.com", "discord.com"]
    titles = {
        "youtube.com": ["Funny Cat Videos", "How to build a PC", "Learn Python in 10 hours"],
        "tiktok.com": ["Viral Dance Challenge", "Comedy Skit", "DIY Home Decor"],
        "roblox.com": ["Adopt Me! Gameplay", "Tower of Hell Speedrun", "Jailbreak Heist"],
        "netflix.com": ["Stranger Things", "The Witcher", "Squid Game"],
        "google.com": ["How to tie a tie", "Weather forecast", "Python tutorials"],
        "discord.com": ["Gaming Friends", "Study Group", "Art Community"]
    }

    start_time = datetime.utcnow()
    for i in range(limit):
        domain = random.choice(domains)
        title = random.choice(titles[domain])
        
        # Apply filter if provided
        if filter and not (filter.lower() in domain.lower() or filter.lower() in title.lower()):
            continue

        item = WebHistory(
            id=str(uuid.uuid4()),
            child_id=child_id,
            url=f"https://{domain}/page/{i}",
            title=title,
            timestamp=start_time - timedelta(minutes=i*15 + page * limit),
            domain=domain,
            visit_duration=random.randint(10, 300)
        )
        history_items.append(item)

    return history_items

# --- Existing GET Endpoints & Mobile Sync ---

# (The rest of the file remains the same...)
