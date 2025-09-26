#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Mobile Monitoring App
Tests all mobile app integration endpoints and remote control features
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os
import sys

# Add backend to path for imports
sys.path.append('/app/backend')

# Test configuration
BACKEND_URL = "https://guardianapp-9.preview.emergentagent.com/api"
TEST_USER_EMAIL = "parent@example.com"
TEST_USER_PASSWORD = "SecurePass123!"

class MobileMonitoringTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_child_id = None
        self.test_device_id = None
        self.test_user_id = None
        self.results = {
            "passed": [],
            "failed": [],
            "errors": []
        }
    
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
    
    async def cleanup_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
    
    async def register_test_user(self):
        """Register a test user for authentication"""
        try:
            user_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Test Parent",
                "phone": "+1234567890"
            }
            
            async with self.session.post(f"{BACKEND_URL}/auth/register", json=user_data) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    print(f"✅ Test user registered successfully")
                    return True
                elif response.status == 400:
                    # User might already exist, try to login
                    print("ℹ️ User already exists, proceeding to login")
                    return True
                else:
                    print(f"❌ Failed to register user: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Error registering user: {e}")
            return False
    
    async def login_user(self):
        """Login and get authentication token"""
        try:
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    self.test_user_id = data.get("user", {}).get("id")
                    print(f"✅ User logged in successfully")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Failed to login: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Error logging in: {e}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    async def test_device_registration(self):
        """Test mobile device registration endpoint"""
        print("\n🔧 Testing Device Registration...")
        
        try:
            # Generate unique device ID
            self.test_device_id = f"test_device_{uuid.uuid4().hex[:8]}"
            
            device_data = {
                "device_id": self.test_device_id,
                "device_name": "Test Android Device",
                "device_model": "Samsung Galaxy S21",
                "android_version": "12",
                "app_version": "1.0.0",
                "device_info": {
                    "manufacturer": "Samsung",
                    "brand": "samsung",
                    "hardware": "exynos2100"
                }
            }
            
            async with self.session.post(f"{BACKEND_URL}/monitoring/devices/register", json=device_data) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("child_id"):
                        self.test_child_id = data["child_id"]
                        self.results["passed"].append("Device Registration")
                        print(f"✅ Device registered successfully - Child ID: {self.test_child_id}")
                        return True
                    else:
                        self.results["failed"].append("Device Registration - Invalid response")
                        print(f"❌ Device registration failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Device Registration - HTTP {response.status}")
                    print(f"❌ Device registration failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Device Registration - {str(e)}")
            print(f"❌ Device registration error: {e}")
            return False
    
    async def test_health_check(self):
        """Test health check endpoint"""
        print("\n🔧 Testing Health Check...")
        
        try:
            async with self.session.get(f"{BACKEND_URL}/monitoring/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy":
                        self.results["passed"].append("Health Check")
                        print("✅ Health check passed")
                        return True
                    else:
                        self.results["failed"].append("Health Check - Invalid status")
                        print(f"❌ Health check failed - Invalid status: {data}")
                        return False
                else:
                    self.results["failed"].append(f"Health Check - HTTP {response.status}")
                    print(f"❌ Health check failed: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Health Check - {str(e)}")
            print(f"❌ Health check error: {e}")
            return False
    
    async def test_call_logs_batch_sync(self):
        """Test batch call logs sync"""
        print("\n🔧 Testing Call Logs Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            call_logs_data = {
                "call_logs": [
                    {
                        "phoneNumber": "+1234567890",
                        "name": "Mom",
                        "timestamp": datetime.utcnow().isoformat(),
                        "duration": 120,
                        "type": "outgoing"
                    },
                    {
                        "phoneNumber": "+0987654321",
                        "name": "Dad",
                        "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                        "duration": 45,
                        "type": "incoming"
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/calls/batch",
                json=call_logs_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 2:
                        self.results["passed"].append("Call Logs Batch Sync")
                        print("✅ Call logs batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("Call Logs Batch Sync - Invalid response")
                        print(f"❌ Call logs batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Call Logs Batch Sync - HTTP {response.status}")
                    print(f"❌ Call logs batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Call Logs Batch Sync - {str(e)}")
            print(f"❌ Call logs batch sync error: {e}")
            return False
    
    async def test_location_sync(self):
        """Test location sync"""
        print("\n🔧 Testing Location Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            location_data = {
                "latitude": 37.7749,
                "longitude": -122.4194,
                "accuracy": 10,
                "timestamp": datetime.utcnow().isoformat(),
                "speed": 0,
                "heading": 0
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/location",
                json=location_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.results["passed"].append("Location Sync")
                        print("✅ Location sync successful")
                        return True
                    else:
                        self.results["failed"].append("Location Sync - Invalid response")
                        print(f"❌ Location sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Location Sync - HTTP {response.status}")
                    print(f"❌ Location sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Location Sync - {str(e)}")
            print(f"❌ Location sync error: {e}")
            return False
    
    async def test_app_usage_batch_sync(self):
        """Test app usage batch sync"""
        print("\n🔧 Testing App Usage Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            app_usage_data = {
                "app_usage": [
                    {
                        "packageName": "com.instagram.android",
                        "appName": "Instagram",
                        "totalTimeInForeground": 3600000,  # 1 hour in milliseconds
                        "firstTimeStamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
                        "lastTimeStamp": datetime.utcnow().isoformat(),
                        "lastTimeUsed": datetime.utcnow().isoformat()
                    },
                    {
                        "packageName": "com.whatsapp",
                        "appName": "WhatsApp",
                        "totalTimeInForeground": 1800000,  # 30 minutes
                        "firstTimeStamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
                        "lastTimeStamp": datetime.utcnow().isoformat(),
                        "lastTimeUsed": datetime.utcnow().isoformat()
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/apps/batch",
                json=app_usage_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 2:
                        self.results["passed"].append("App Usage Batch Sync")
                        print("✅ App usage batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("App Usage Batch Sync - Invalid response")
                        print(f"❌ App usage batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"App Usage Batch Sync - HTTP {response.status}")
                    print(f"❌ App usage batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"App Usage Batch Sync - {str(e)}")
            print(f"❌ App usage batch sync error: {e}")
            return False
    
    async def test_contacts_batch_sync(self):
        """Test contacts batch sync"""
        print("\n🔧 Testing Contacts Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            contacts_data = {
                "contacts": [
                    {
                        "recordID": "1",
                        "displayName": "Mom",
                        "givenName": "Sarah",
                        "familyName": "Johnson",
                        "phoneNumbers": [{"number": "+1234567890", "label": "mobile"}],
                        "emailAddresses": [{"email": "mom@example.com", "label": "home"}]
                    },
                    {
                        "recordID": "2",
                        "displayName": "Dad",
                        "givenName": "John",
                        "familyName": "Johnson",
                        "phoneNumbers": [{"number": "+0987654321", "label": "mobile"}],
                        "emailAddresses": [{"email": "dad@example.com", "label": "work"}]
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/contacts/batch",
                json=contacts_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 2:
                        self.results["passed"].append("Contacts Batch Sync")
                        print("✅ Contacts batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("Contacts Batch Sync - Invalid response")
                        print(f"❌ Contacts batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Contacts Batch Sync - HTTP {response.status}")
                    print(f"❌ Contacts batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Contacts Batch Sync - {str(e)}")
            print(f"❌ Contacts batch sync error: {e}")
            return False
    
    async def test_social_media_batch_sync(self):
        """Test social media activities batch sync"""
        print("\n🔧 Testing Social Media Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            social_media_data = {
                "activities": [
                    {
                        "app": "Instagram",
                        "packageName": "com.instagram.android",
                        "eventType": "post_viewed",
                        "content": {
                            "post_id": "12345",
                            "author": "@friend_user",
                            "content_type": "image"
                        },
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    {
                        "app": "TikTok",
                        "packageName": "com.zhiliaoapp.musically",
                        "eventType": "video_watched",
                        "content": {
                            "video_id": "67890",
                            "author": "@tiktok_user",
                            "duration": 30
                        },
                        "timestamp": (datetime.utcnow() - timedelta(minutes=30)).isoformat()
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/social-media/batch",
                json=social_media_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 2:
                        self.results["passed"].append("Social Media Batch Sync")
                        print("✅ Social media batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("Social Media Batch Sync - Invalid response")
                        print(f"❌ Social media batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Social Media Batch Sync - HTTP {response.status}")
                    print(f"❌ Social media batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Social Media Batch Sync - {str(e)}")
            print(f"❌ Social media batch sync error: {e}")
            return False
    
    async def test_device_status_update(self):
        """Test device status update"""
        print("\n🔧 Testing Device Status Update...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            status_data = {
                "status": "active",
                "batteryLevel": 85,
                "isCharging": False,
                "monitoringStatus": {
                    "location_enabled": True,
                    "app_monitoring_enabled": True,
                    "social_media_monitoring_enabled": True,
                    "stealth_mode": True
                }
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/status",
                json=status_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        self.results["passed"].append("Device Status Update")
                        print("✅ Device status update successful")
                        return True
                    else:
                        self.results["failed"].append("Device Status Update - Invalid response")
                        print(f"❌ Device status update failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Device Status Update - HTTP {response.status}")
                    print(f"❌ Device status update failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Device Status Update - {str(e)}")
            print(f"❌ Device status update error: {e}")
            return False
    
    async def test_alert_creation(self):
        """Test alert creation from mobile"""
        print("\n🔧 Testing Alert Creation...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            alert_data = {
                "type": "app_blocked",
                "message": "Instagram was blocked due to time limit",
                "data": {
                    "app_name": "Instagram",
                    "package_name": "com.instagram.android",
                    "reason": "time_limit_exceeded"
                },
                "severity": "medium",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/alerts",
                json=alert_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("alert_id"):
                        self.results["passed"].append("Alert Creation")
                        print("✅ Alert creation successful")
                        return True
                    else:
                        self.results["failed"].append("Alert Creation - Invalid response")
                        print(f"❌ Alert creation failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Alert Creation - HTTP {response.status}")
                    print(f"❌ Alert creation failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Alert Creation - {str(e)}")
            print(f"❌ Alert creation error: {e}")
            return False
    
    async def test_control_events_batch_sync(self):
        """Test control events batch sync"""
        print("\n🔧 Testing Control Events Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            events_data = {
                "events": [
                    {
                        "eventType": "app_blocked",
                        "packageName": "com.instagram.android",
                        "reason": "time_limit_exceeded",
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    {
                        "eventType": "app_unblocked",
                        "packageName": "com.whatsapp",
                        "reason": "parent_override",
                        "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat()
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/control-events/batch",
                json=events_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 2:
                        self.results["passed"].append("Control Events Batch Sync")
                        print("✅ Control events batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("Control Events Batch Sync - Invalid response")
                        print(f"❌ Control events batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Control Events Batch Sync - HTTP {response.status}")
                    print(f"❌ Control events batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Control Events Batch Sync - {str(e)}")
            print(f"❌ Control events batch sync error: {e}")
            return False
    
    async def test_security_events_batch_sync(self):
        """Test security events batch sync"""
        print("\n🔧 Testing Security Events Batch Sync...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            events_data = {
                "events": [
                    {
                        "type": "tamper_attempt",
                        "details": {
                            "action": "uninstall_attempt",
                            "app_name": "ParentGuard Monitor"
                        },
                        "severity": "high",
                        "timestamp": datetime.utcnow().isoformat(),
                        "deviceInfo": {
                            "model": "Samsung Galaxy S21",
                            "android_version": "12"
                        }
                    }
                ]
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/security-events/batch",
                json=events_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 1:
                        self.results["passed"].append("Security Events Batch Sync")
                        print("✅ Security events batch sync successful")
                        return True
                    else:
                        self.results["failed"].append("Security Events Batch Sync - Invalid response")
                        print(f"❌ Security events batch sync failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Security Events Batch Sync - HTTP {response.status}")
                    print(f"❌ Security events batch sync failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Security Events Batch Sync - {str(e)}")
            print(f"❌ Security events batch sync error: {e}")
            return False
    
    async def test_device_updates(self):
        """Test device updates retrieval"""
        print("\n🔧 Testing Device Updates...")
        
        if not self.test_device_id:
            print("❌ No device_id available for testing")
            return False
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/monitoring/devices/{self.test_device_id}/updates"
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "updates" in data:
                        self.results["passed"].append("Device Updates")
                        print("✅ Device updates retrieval successful")
                        return True
                    else:
                        self.results["failed"].append("Device Updates - Invalid response")
                        print(f"❌ Device updates failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Device Updates - HTTP {response.status}")
                    print(f"❌ Device updates failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Device Updates - {str(e)}")
            print(f"❌ Device updates error: {e}")
            return False
    
    async def link_child_to_parent(self):
        """Link the test child to the parent user for remote control tests"""
        if not self.test_child_id or not self.test_user_id:
            return False
        
        try:
            # Update child record to link to parent
            from database import db
            success = await db.update_one(
                "children",
                {"_id": self.test_child_id},
                {"user_id": self.test_user_id}
            )
            return success
        except Exception as e:
            print(f"❌ Error linking child to parent: {e}")
            return False
    
    async def test_remote_app_blocking(self):
        """Test remote app blocking"""
        print("\n🔧 Testing Remote App Blocking...")
        
        if not self.test_child_id or not self.auth_token:
            print("❌ No child_id or auth_token available for testing")
            return False
        
        # First link child to parent
        await self.link_child_to_parent()
        
        try:
            block_data = {
                "package_name": "com.instagram.android",
                "blocked": True,
                "time_limit": "02:00:00"
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/control/{self.test_child_id}/remote/block-app",
                json=block_data,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "command_id" in data:
                        self.results["passed"].append("Remote App Blocking")
                        print("✅ Remote app blocking successful")
                        return True
                    else:
                        self.results["failed"].append("Remote App Blocking - Invalid response")
                        print(f"❌ Remote app blocking failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Remote App Blocking - HTTP {response.status}")
                    print(f"❌ Remote app blocking failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Remote App Blocking - {str(e)}")
            print(f"❌ Remote app blocking error: {e}")
            return False
    
    async def test_emergency_location_request(self):
        """Test emergency location request"""
        print("\n🔧 Testing Emergency Location Request...")
        
        if not self.test_child_id or not self.auth_token:
            print("❌ No child_id or auth_token available for testing")
            return False
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/control/{self.test_child_id}/remote/emergency-location",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "command_id" in data:
                        self.results["passed"].append("Emergency Location Request")
                        print("✅ Emergency location request successful")
                        return True
                    else:
                        self.results["failed"].append("Emergency Location Request - Invalid response")
                        print(f"❌ Emergency location request failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Emergency Location Request - HTTP {response.status}")
                    print(f"❌ Emergency location request failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Emergency Location Request - {str(e)}")
            print(f"❌ Emergency location request error: {e}")
            return False
    
    async def test_remote_screenshot(self):
        """Test remote screenshot request"""
        print("\n🔧 Testing Remote Screenshot...")
        
        if not self.test_child_id or not self.auth_token:
            print("❌ No child_id or auth_token available for testing")
            return False
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/control/{self.test_child_id}/remote/screenshot",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "command_id" in data:
                        self.results["passed"].append("Remote Screenshot")
                        print("✅ Remote screenshot request successful")
                        return True
                    else:
                        self.results["failed"].append("Remote Screenshot - Invalid response")
                        print(f"❌ Remote screenshot failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Remote Screenshot - HTTP {response.status}")
                    print(f"❌ Remote screenshot failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Remote Screenshot - {str(e)}")
            print(f"❌ Remote screenshot error: {e}")
            return False
    
    async def test_remote_settings_update(self):
        """Test remote settings update"""
        print("\n🔧 Testing Remote Settings Update...")
        
        if not self.test_child_id or not self.auth_token:
            print("❌ No child_id or auth_token available for testing")
            return False
        
        try:
            settings_data = {
                "monitoring_enabled": True,
                "stealth_mode": True,
                "location_frequency": 300,  # 5 minutes
                "app_monitoring": {
                    "enabled": True,
                    "social_media_monitoring": True
                }
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/control/{self.test_child_id}/remote/update-settings",
                json=settings_data,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "command_id" in data:
                        self.results["passed"].append("Remote Settings Update")
                        print("✅ Remote settings update successful")
                        return True
                    else:
                        self.results["failed"].append("Remote Settings Update - Invalid response")
                        print(f"❌ Remote settings update failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Remote Settings Update - HTTP {response.status}")
                    print(f"❌ Remote settings update failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Remote Settings Update - {str(e)}")
            print(f"❌ Remote settings update error: {e}")
            return False
    
    async def test_command_history(self):
        """Test command history retrieval"""
        print("\n🔧 Testing Command History...")
        
        if not self.test_child_id or not self.auth_token:
            print("❌ No child_id or auth_token available for testing")
            return False
        
        try:
            async with self.session.get(
                f"{BACKEND_URL}/control/{self.test_child_id}/remote/commands",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if "commands" in data:
                        self.results["passed"].append("Command History")
                        print("✅ Command history retrieval successful")
                        return True
                    else:
                        self.results["failed"].append("Command History - Invalid response")
                        print(f"❌ Command history failed - Invalid response: {data}")
                        return False
                else:
                    error_text = await response.text()
                    self.results["failed"].append(f"Command History - HTTP {response.status}")
                    print(f"❌ Command history failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Command History - {str(e)}")
            print(f"❌ Command history error: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Mobile Monitoring App Backend Tests")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup phase
            print("\n📋 Setup Phase")
            await self.register_test_user()
            await self.login_user()
            
            # Mobile app integration tests (no auth required)
            print("\n📱 Mobile App Integration Tests")
            await self.test_device_registration()
            await self.test_health_check()
            await self.test_call_logs_batch_sync()
            await self.test_location_sync()
            await self.test_app_usage_batch_sync()
            await self.test_contacts_batch_sync()
            await self.test_social_media_batch_sync()
            await self.test_device_status_update()
            await self.test_alert_creation()
            await self.test_control_events_batch_sync()
            await self.test_security_events_batch_sync()
            await self.test_device_updates()
            
            # Remote control tests (auth required)
            print("\n🎮 Remote Control Tests")
            await self.test_remote_app_blocking()
            await self.test_emergency_location_request()
            await self.test_remote_screenshot()
            await self.test_remote_settings_update()
            await self.test_command_history()
            
        finally:
            await self.cleanup_session()
        
        # Print results
        self.print_results()
    
    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results["passed"]) + len(self.results["failed"]) + len(self.results["errors"])
        
        print(f"\n✅ PASSED ({len(self.results['passed'])}/{total_tests}):")
        for test in self.results["passed"]:
            print(f"   • {test}")
        
        if self.results["failed"]:
            print(f"\n❌ FAILED ({len(self.results['failed'])}/{total_tests}):")
            for test in self.results["failed"]:
                print(f"   • {test}")
        
        if self.results["errors"]:
            print(f"\n🚨 ERRORS ({len(self.results['errors'])}/{total_tests}):")
            for test in self.results["errors"]:
                print(f"   • {test}")
        
        success_rate = (len(self.results["passed"]) / total_tests * 100) if total_tests > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Excellent! Most tests passed.")
        elif success_rate >= 70:
            print("👍 Good! Most functionality is working.")
        elif success_rate >= 50:
            print("⚠️ Some issues found. Review failed tests.")
        else:
            print("🚨 Major issues detected. Immediate attention required.")


async def main():
    """Main test runner"""
    tester = MobileMonitoringTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())