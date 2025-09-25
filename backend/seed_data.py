#!/usr/bin/env python3
"""
Data seeder script to populate the database with sample data for testing
"""

import asyncio
from datetime import datetime, timedelta
import uuid
from database import db
from services.auth_service import AuthService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_users():
    """Seed sample users"""
    logger.info("Seeding users...")
    
    # Create parent user
    user_data = {
        "email": "sarah.johnson@email.com",
        "password": AuthService.hash_password("password123"),
        "name": "Sarah Johnson",
        "avatar": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
        "subscription": "Premium",
        "is_active": True
    }
    
    user_id = await db.create_user(user_data)
    logger.info(f"Created user: {user_id}")
    return user_id


async def seed_children(user_id: str):
    """Seed sample children"""
    logger.info("Seeding children...")
    
    children_data = [
        {
            "user_id": user_id,
            "name": "Emma Johnson",
            "age": 14,
            "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
            "device": "iPhone 15",
            "device_id": "iphone_emma_001",
            "status": "online"
        },
        {
            "user_id": user_id,
            "name": "Alex Johnson", 
            "age": 12,
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            "device": "Samsung Galaxy S24",
            "device_id": "android_alex_001",
            "status": "offline",
            "last_seen": datetime.utcnow() - timedelta(hours=2)
        }
    ]
    
    child_ids = []
    for child_data in children_data:
        child_id = await db.create_one("children", child_data)
        child_ids.append(child_id)
        logger.info(f"Created child: {child_id}")
    
    return child_ids


async def seed_call_logs(child_ids: list):
    """Seed call logs"""
    logger.info("Seeding call logs...")
    
    call_logs = [
        {
            "child_id": child_ids[0],
            "type": "incoming",
            "contact": "Mom",
            "number": "+1 (555) 123-4567",
            "duration": "00:05:32",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "status": "answered"
        },
        {
            "child_id": child_ids[0],
            "type": "outgoing",
            "contact": "Jake Miller",
            "number": "+1 (555) 987-6543", 
            "duration": "00:12:45",
            "timestamp": datetime.utcnow() - timedelta(hours=4),
            "status": "answered"
        },
        {
            "child_id": child_ids[1],
            "type": "incoming",
            "contact": "Unknown",
            "number": "+1 (555) 456-7890",
            "duration": "00:00:00",
            "timestamp": datetime.utcnow() - timedelta(hours=6),
            "status": "missed"
        }
    ]
    
    for call_log in call_logs:
        await db.create_one("call_logs", call_log)
    
    logger.info(f"Created {len(call_logs)} call logs")


async def seed_messages(child_ids: list):
    """Seed messages"""
    logger.info("Seeding messages...")
    
    messages = [
        {
            "child_id": child_ids[0],
            "type": "sms",
            "contact": "Jake Miller",
            "number": "+1 (555) 987-6543",
            "content": "Hey Emma! Are we still on for the movie tonight?",
            "timestamp": datetime.utcnow() - timedelta(hours=1),
            "direction": "incoming"
        },
        {
            "child_id": child_ids[0],
            "type": "sms", 
            "contact": "Jake Miller",
            "number": "+1 (555) 987-6543",
            "content": "Yes! Meet at 7pm at the mall entrance",
            "timestamp": datetime.utcnow() - timedelta(minutes=45),
            "direction": "outgoing"
        },
        {
            "child_id": child_ids[0],
            "type": "whatsapp",
            "contact": "Sophie Chen",
            "content": "OMG did you see what happened at school today?? 😱",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "direction": "incoming"
        }
    ]
    
    for message in messages:
        await db.create_one("messages", message)
    
    logger.info(f"Created {len(messages)} messages")


async def seed_locations(child_ids: list):
    """Seed location data"""
    logger.info("Seeding locations...")
    
    locations = [
        {
            "child_id": child_ids[0],
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "Madison High School, New York, NY",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "accuracy": 10
        },
        {
            "child_id": child_ids[0],
            "latitude": 40.7589,
            "longitude": -73.9851,
            "address": "Central Park, New York, NY", 
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "accuracy": 15
        },
        {
            "child_id": child_ids[1],
            "latitude": 40.7614,
            "longitude": -73.9776,
            "address": "Home - 123 Main St, New York, NY",
            "timestamp": datetime.utcnow() - timedelta(minutes=10),
            "accuracy": 5
        }
    ]
    
    for location in locations:
        await db.create_one("locations", location)
    
    logger.info(f"Created {len(locations)} locations")


async def seed_app_usage(child_ids: list):
    """Seed app usage data"""
    logger.info("Seeding app usage...")
    
    apps = [
        {
            "child_id": child_ids[0],
            "name": "Instagram",
            "package_name": "com.instagram.android",
            "icon": "📷",
            "category": "Social",
            "time_spent": "02:45:30",
            "launches": 23,
            "last_used": datetime.utcnow() - timedelta(minutes=15),
            "blocked": False,
            "time_limit": "03:00:00",
            "date": datetime.utcnow()
        },
        {
            "child_id": child_ids[0],
            "name": "TikTok",
            "package_name": "com.zhiliaoapp.musically",
            "icon": "🎵", 
            "category": "Social",
            "time_spent": "04:12:15",
            "launches": 45,
            "last_used": datetime.utcnow() - timedelta(minutes=5),
            "blocked": False,
            "time_limit": "02:00:00",
            "exceeded": True,
            "date": datetime.utcnow()
        },
        {
            "child_id": child_ids[0],
            "name": "Snapchat",
            "package_name": "com.snapchat.android",
            "icon": "👻",
            "category": "Social",
            "time_spent": "00:00:00",
            "launches": 0,
            "last_used": None,
            "blocked": True,
            "time_limit": "00:30:00",
            "date": datetime.utcnow()
        }
    ]
    
    for app in apps:
        await db.create_one("app_usage", app)
    
    logger.info(f"Created {len(apps)} app usage records")


async def seed_web_history(child_ids: list):
    """Seed web history"""
    logger.info("Seeding web history...")
    
    web_history = [
        {
            "child_id": child_ids[0],
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "title": "Study Music - Lofi Hip Hop Beats",
            "domain": "youtube.com",
            "timestamp": datetime.utcnow() - timedelta(minutes=45),
            "category": "Entertainment",
            "blocked": False
        },
        {
            "child_id": child_ids[0],
            "url": "https://www.khanacademy.org/math/algebra",
            "title": "Algebra Basics | Khan Academy",
            "domain": "khanacademy.org",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "category": "Education",
            "blocked": False
        },
        {
            "child_id": child_ids[1],
            "url": "https://blocked-site.com",
            "title": "Inappropriate Content Site",
            "domain": "blocked-site.com",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "category": "Adult",
            "blocked": True
        }
    ]
    
    for entry in web_history:
        await db.create_one("web_history", entry)
    
    logger.info(f"Created {len(web_history)} web history entries")


async def seed_alerts(child_ids: list):
    """Seed alerts"""
    logger.info("Seeding alerts...")
    
    alerts = [
        {
            "child_id": child_ids[0],
            "type": "location",
            "severity": "medium",
            "title": "Left Safe Zone",
            "description": "Emma has left the school area",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "read": False,
            "location": {
                "latitude": 40.7128,
                "longitude": -74.0060,
                "address": "Madison High School, New York, NY"
            }
        },
        {
            "child_id": child_ids[0],
            "type": "app",
            "severity": "low", 
            "title": "Time Limit Exceeded",
            "description": "TikTok usage exceeded daily limit of 2 hours",
            "timestamp": datetime.utcnow() - timedelta(hours=1),
            "read": False,
            "app": "TikTok"
        },
        {
            "child_id": child_ids[1],
            "type": "web",
            "severity": "high",
            "title": "Blocked Site Access",
            "description": "Attempted to access inappropriate content", 
            "timestamp": datetime.utcnow() - timedelta(minutes=45),
            "read": True,
            "url": "blocked-site.com"
        }
    ]
    
    for alert in alerts:
        await db.create_one("alerts", alert)
    
    logger.info(f"Created {len(alerts)} alerts")


async def seed_control_settings(child_ids: list):
    """Seed control settings"""
    logger.info("Seeding control settings...")
    
    for child_id in child_ids:
        settings = {
            "child_id": child_id,
            "app_time_limits": {
                "com.instagram.android": "03:00:00",
                "com.zhiliaoapp.musically": "02:00:00",
                "com.snapchat.android": "00:30:00"
            },
            "blocked_apps": ["com.snapchat.android"],
            "blocked_websites": ["blocked-site.com", "inappropriate-content.com"],
            "bedtime_restrictions": {
                "start_time": "22:00",
                "end_time": "07:00"
            },
            "safe_search_enabled": True,
            "location_tracking_enabled": True
        }
        
        await db.create_one("control_settings", settings)
    
    logger.info(f"Created control settings for {len(child_ids)} children")


async def main():
    """Main seeding function"""
    try:
        logger.info("Starting database seeding...")
        
        # Clear existing data (optional - comment out to preserve data)
        # await clear_existing_data()
        
        # Seed data in order
        user_id = await seed_users()
        child_ids = await seed_children(user_id)
        await seed_call_logs(child_ids)
        await seed_messages(child_ids)
        await seed_locations(child_ids)
        await seed_app_usage(child_ids) 
        await seed_web_history(child_ids)
        await seed_alerts(child_ids)
        await seed_control_settings(child_ids)
        
        logger.info("Database seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"Seeding failed: {e}")
    finally:
        # Close database connection
        db.client.close()


if __name__ == "__main__":
    asyncio.run(main())