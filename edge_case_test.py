#!/usr/bin/env python3
"""
Edge Case Testing for Mobile Monitoring App Backend
Tests error handling, validation, and edge cases
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timedelta
import sys

# Add backend to path for imports
sys.path.append('/app/backend')

# Test configuration
BACKEND_URL = "https://guardianapp-9.preview.emergentagent.com/api"
TEST_USER_EMAIL = "parent@example.com"
TEST_USER_PASSWORD = "SecurePass123!"

class EdgeCaseTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_child_id = None
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
                    return True
                else:
                    return False
        except Exception as e:
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    async def test_invalid_device_registration(self):
        """Test device registration with invalid data"""
        print("\n🔧 Testing Invalid Device Registration...")
        
        try:
            # Test with missing device_id
            invalid_data = {
                "device_name": "Test Device",
                "device_model": "Samsung Galaxy S21"
                # Missing device_id
            }
            
            async with self.session.post(f"{BACKEND_URL}/monitoring/devices/register", json=invalid_data) as response:
                if response.status == 400:
                    self.results["passed"].append("Invalid Device Registration - Missing device_id")
                    print("✅ Correctly rejected registration with missing device_id")
                    return True
                else:
                    self.results["failed"].append("Invalid Device Registration - Should reject missing device_id")
                    print(f"❌ Should have rejected missing device_id, got: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Invalid Device Registration - {str(e)}")
            print(f"❌ Error testing invalid device registration: {e}")
            return False
    
    async def test_empty_batch_operations(self):
        """Test batch operations with empty data"""
        print("\n🔧 Testing Empty Batch Operations...")
        
        # First register a device to get child_id
        device_data = {
            "device_id": f"test_edge_{uuid.uuid4().hex[:8]}",
            "device_name": "Edge Test Device"
        }
        
        async with self.session.post(f"{BACKEND_URL}/monitoring/devices/register", json=device_data) as response:
            if response.status == 200:
                data = await response.json()
                self.test_child_id = data["child_id"]
            else:
                print("❌ Failed to register device for edge case testing")
                return False
        
        try:
            # Test empty call logs batch
            empty_data = {"call_logs": []}
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/calls/batch",
                json=empty_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 0:
                        self.results["passed"].append("Empty Batch Operations")
                        print("✅ Empty batch operations handled correctly")
                        return True
                    else:
                        self.results["failed"].append("Empty Batch Operations - Invalid response")
                        print(f"❌ Empty batch failed - Invalid response: {data}")
                        return False
                else:
                    self.results["failed"].append(f"Empty Batch Operations - HTTP {response.status}")
                    print(f"❌ Empty batch failed: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Empty Batch Operations - {str(e)}")
            print(f"❌ Error testing empty batch operations: {e}")
            return False
    
    async def test_invalid_child_id_access(self):
        """Test accessing endpoints with invalid child_id"""
        print("\n🔧 Testing Invalid Child ID Access...")
        
        if not self.auth_token:
            print("❌ No auth token available")
            return False
        
        try:
            fake_child_id = "invalid_child_id_12345"
            
            async with self.session.post(
                f"{BACKEND_URL}/control/{fake_child_id}/remote/block-app",
                json={"package_name": "com.test.app", "blocked": True},
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 403:
                    self.results["passed"].append("Invalid Child ID Access")
                    print("✅ Correctly rejected access to invalid child_id")
                    return True
                else:
                    self.results["failed"].append("Invalid Child ID Access - Should reject invalid child_id")
                    print(f"❌ Should have rejected invalid child_id, got: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Invalid Child ID Access - {str(e)}")
            print(f"❌ Error testing invalid child_id access: {e}")
            return False
    
    async def test_unauthorized_access(self):
        """Test accessing protected endpoints without authentication"""
        print("\n🔧 Testing Unauthorized Access...")
        
        try:
            # Try to access a protected endpoint without auth token
            async with self.session.post(
                f"{BACKEND_URL}/control/some_child_id/remote/block-app",
                json={"package_name": "com.test.app", "blocked": True}
            ) as response:
                if response.status == 401:
                    self.results["passed"].append("Unauthorized Access")
                    print("✅ Correctly rejected unauthorized access")
                    return True
                else:
                    self.results["failed"].append("Unauthorized Access - Should reject without auth")
                    print(f"❌ Should have rejected unauthorized access, got: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Unauthorized Access - {str(e)}")
            print(f"❌ Error testing unauthorized access: {e}")
            return False
    
    async def test_malformed_json_data(self):
        """Test endpoints with malformed JSON data"""
        print("\n🔧 Testing Malformed JSON Data...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            # Test with invalid location data (missing required fields)
            invalid_location = {
                "latitude": "invalid_latitude",  # Should be float
                "longitude": -122.4194,
                "accuracy": "not_a_number"  # Should be int
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/location",
                json=invalid_location
            ) as response:
                # Should handle gracefully (either 400 or 500 with proper error handling)
                if response.status in [400, 422, 500]:
                    self.results["passed"].append("Malformed JSON Data")
                    print("✅ Malformed JSON data handled appropriately")
                    return True
                else:
                    self.results["failed"].append("Malformed JSON Data - Should handle invalid data")
                    print(f"❌ Should have handled malformed data, got: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Malformed JSON Data - {str(e)}")
            print(f"❌ Error testing malformed JSON data: {e}")
            return False
    
    async def test_large_batch_operations(self):
        """Test batch operations with large datasets"""
        print("\n🔧 Testing Large Batch Operations...")
        
        if not self.test_child_id:
            print("❌ No child_id available for testing")
            return False
        
        try:
            # Create a large batch of call logs (100 entries)
            large_call_logs = {
                "call_logs": []
            }
            
            for i in range(100):
                large_call_logs["call_logs"].append({
                    "phoneNumber": f"+123456789{i:02d}",
                    "name": f"Contact {i}",
                    "timestamp": (datetime.utcnow() - timedelta(minutes=i)).isoformat(),
                    "duration": 60 + i,
                    "type": "outgoing" if i % 2 == 0 else "incoming"
                })
            
            async with self.session.post(
                f"{BACKEND_URL}/monitoring/{self.test_child_id}/calls/batch",
                json=large_call_logs
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("synced") == 100:
                        self.results["passed"].append("Large Batch Operations")
                        print("✅ Large batch operations handled successfully")
                        return True
                    else:
                        self.results["failed"].append("Large Batch Operations - Invalid response")
                        print(f"❌ Large batch failed - Invalid response: {data}")
                        return False
                else:
                    self.results["failed"].append(f"Large Batch Operations - HTTP {response.status}")
                    print(f"❌ Large batch failed: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Large Batch Operations - {str(e)}")
            print(f"❌ Error testing large batch operations: {e}")
            return False
    
    async def test_duplicate_device_registration(self):
        """Test registering the same device multiple times"""
        print("\n🔧 Testing Duplicate Device Registration...")
        
        try:
            device_id = f"duplicate_test_{uuid.uuid4().hex[:8]}"
            device_data = {
                "device_id": device_id,
                "device_name": "Duplicate Test Device"
            }
            
            # First registration
            async with self.session.post(f"{BACKEND_URL}/monitoring/devices/register", json=device_data) as response:
                if response.status != 200:
                    print("❌ First registration failed")
                    return False
                first_data = await response.json()
                first_child_id = first_data.get("child_id")
            
            # Second registration with same device_id
            async with self.session.post(f"{BACKEND_URL}/monitoring/devices/register", json=device_data) as response:
                if response.status == 200:
                    second_data = await response.json()
                    second_child_id = second_data.get("child_id")
                    
                    if first_child_id == second_child_id:
                        self.results["passed"].append("Duplicate Device Registration")
                        print("✅ Duplicate device registration handled correctly (same child_id returned)")
                        return True
                    else:
                        self.results["failed"].append("Duplicate Device Registration - Different child_ids")
                        print("❌ Duplicate registration created different child_ids")
                        return False
                else:
                    self.results["failed"].append(f"Duplicate Device Registration - HTTP {response.status}")
                    print(f"❌ Duplicate registration failed: {response.status}")
                    return False
        except Exception as e:
            self.results["errors"].append(f"Duplicate Device Registration - {str(e)}")
            print(f"❌ Error testing duplicate device registration: {e}")
            return False
    
    async def run_edge_case_tests(self):
        """Run all edge case tests"""
        print("🧪 Starting Edge Case Tests for Mobile Monitoring App")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Setup
            await self.login_user()
            
            # Run edge case tests
            await self.test_invalid_device_registration()
            await self.test_empty_batch_operations()
            await self.test_invalid_child_id_access()
            await self.test_unauthorized_access()
            await self.test_malformed_json_data()
            await self.test_large_batch_operations()
            await self.test_duplicate_device_registration()
            
        finally:
            await self.cleanup_session()
        
        # Print results
        self.print_results()
    
    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 EDGE CASE TEST RESULTS")
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
        print(f"\n📈 Edge Case Success Rate: {success_rate:.1f}%")


async def main():
    """Main test runner"""
    tester = EdgeCaseTester()
    await tester.run_edge_case_tests()


if __name__ == "__main__":
    asyncio.run(main())