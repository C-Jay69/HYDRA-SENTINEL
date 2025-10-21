from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
database_name = os.environ.get('DB_NAME', 'parentguard_db')

client = AsyncIOMotorClient(mongo_url)
database = client[database_name]


class Database:
    """Database service class for MongoDB operations"""
    
    def __init__(self):
        self.client = client
        self.db = database
    
    # Collections
    @property
    def users(self):
        return self.db.users

    @property
    def revenue(self):
        return self.db.revenue

    @property
    def new_users(self):
        return self.db.new_users
    
    @property
    def children(self):
        return self.db.children
    
    @property
    def call_logs(self):
        return self.db.call_logs
    
    @property
    def messages(self):
        return self.db.messages
    
    @property
    def locations(self):
        return self.db.locations
    
    @property
    def app_usage(self):
        return self.db.app_usage
    
    @property
    def web_history(self):
        return self.db.web_history
    
    @property
    def alerts(self):
        return self.db.alerts
    
    @property
    def geofences(self):
        return self.db.geofences
    
    @property
    def contacts(self):
        return self.db.contacts

    @property
    def transactions(self):
        return self.db.transactions

    @property
    def control_settings(self):
        return self.db.control_settings

    @property
    def token_blacklist(self):
        return self.db.token_blacklist
    
    # Generic CRUD operations
    async def create_one(self, collection_name: str, document: dict) -> Optional[str]:
        """Create a single document"""
        try:
            collection = getattr(self.db, collection_name)
            document['created_at'] = datetime.utcnow()
            document['updated_at'] = datetime.utcnow()
            
            result = await collection.insert_one(document)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating document in {collection_name}: {e}")
            return None
    
    async def insert_one(self, collection_name: str, document: dict) -> Optional[str]:
        """Insert a single document (alias for create_one)"""
        return await self.create_one(collection_name, document)
    
    async def find_one(self, collection_name: str, filter_dict: dict) -> Optional[dict]:
        """Find a single document"""
        try:
            collection = getattr(self.db, collection_name)
            document = await collection.find_one(filter_dict)
            if document:
                document['_id'] = str(document['_id'])
            return document
        except Exception as e:
            logger.error(f"Error finding document in {collection_name}: {e}")
            return None
    
    async def find_many(self, collection_name: str, filter_dict: dict = {}, 
                       skip: int = 0, limit: int = 100, sort: List[tuple] = None) -> List[dict]:
        """Find multiple documents"""
        try:
            collection = getattr(self.db, collection_name)
            cursor = collection.find(filter_dict).skip(skip).limit(limit)
            
            if sort:
                cursor = cursor.sort(sort)
            
            documents = await cursor.to_list(length=limit)
            for doc in documents:
                doc['_id'] = str(doc['_id'])
            return documents
        except Exception as e:
            logger.error(f"Error finding documents in {collection_name}: {e}")
            return []
    
    async def update_one(self, collection_name: str, filter_dict: dict, 
                        update_dict: dict) -> bool:
        """Update a single document"""
        try:
            collection = getattr(self.db, collection_name)
            update_dict['updated_at'] = datetime.utcnow()
            
            result = await collection.update_one(
                filter_dict,
                {"$set": update_dict}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating document in {collection_name}: {e}")
            return False
    
    async def delete_one(self, collection_name: str, filter_dict: dict) -> bool:
        """Delete a single document"""
        try:
            collection = getattr(self.db, collection_name)
            result = await collection.delete_one(filter_dict)
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting document in {collection_name}: {e}")
            return False
    
    async def insert_many(self, collection_name: str, documents: List[dict]) -> bool:
        """Insert multiple documents"""
        try:
            collection = getattr(self.db, collection_name)
            for doc in documents:
                doc['created_at'] = datetime.utcnow()
                doc['updated_at'] = datetime.utcnow()
            
            result = await collection.insert_many(documents)
            return len(result.inserted_ids) > 0
        except Exception as e:
            logger.error(f"Error inserting documents in {collection_name}: {e}")
            return False
    
    async def delete_many(self, collection_name: str, filter_dict: dict) -> int:
        """Delete multiple documents"""
        try:
            collection = getattr(self.db, collection_name)
            result = await collection.delete_many(filter_dict)
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting documents in {collection_name}: {e}")
            return 0
    
    async def count_documents(self, collection_name: str, filter_dict: dict = {}) -> int:
        """Count documents matching filter"""
        try:
            collection = getattr(self.db, collection_name)
            return await collection.count_documents(filter_dict)
        except Exception as e:
            logger.error(f"Error counting documents in {collection_name}: {e}")
            return 0

    # Token blacklist methods
    async def add_to_blacklist(self, jti: str):
        """Add token JTI to blacklist with expiry"""
        try:
            # Tokens are set to expire, but this provides an extra layer of cleanup
            expiry_date = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS + 1)
            await self.token_blacklist.insert_one({"jti": jti, "expires_at": expiry_date})
        except Exception as e:
            logger.error(f"Error adding token to blacklist: {e}")

    async def is_blacklisted(self, jti: str) -> bool:
        """Check if a token JTI is in the blacklist"""
        try:
            return await self.token_blacklist.find_one({"jti": jti}) is not None
        except Exception as e:
            logger.error(f"Error checking blacklist: {e}")
            return True # Fail safely
    
    # User-specific methods
    async def create_user(self, user_data: dict) -> Optional[str]:
        """Create a new user with unique email constraint"""
        try:
            # Ensure subscription is a string
            if 'subscription' in user_data and hasattr(user_data['subscription'], 'value'):
                user_data['subscription'] = user_data['subscription'].value

            return await self.create_one("users", user_data)
        except DuplicateKeyError:
            logger.warning(f"Attempted to create a user with a duplicate email: {user_data['email']}")
            return None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    async def find_user_by_email(self, email: str) -> Optional[dict]:
        """Find user by email"""
        return await self.find_one("users", {"email": email})
    
    async def find_user_by_google_id(self, google_id: str) -> Optional[dict]:
        """Find user by Google ID"""
        return await self.find_one("users", {"google_id": google_id})
    
    # Child-specific methods
    async def find_children_by_user(self, user_id: str) -> List[dict]:
        """Find all children belonging to a user"""
        return await self.find_many("children", {"user_id": user_id})
    
    # Monitoring data methods
    async def find_child_data(self, collection_name: str, child_id: str, 
                             limit: int = 100) -> List[dict]:
        """Find monitoring data for a specific child"""
        return await self.find_many(
            collection_name, 
            {"child_id": child_id}, 
            limit=limit,
            sort=[("timestamp", -1)]
        )
    
    async def create_alert(self, alert_data: dict) -> Optional[str]:
        """Create an alert and return its ID"""
        return await self.create_one("alerts", alert_data)
    
    async def mark_alert_as_read(self, alert_id: str, child_id: str) -> bool:
        """Mark an alert as read"""
        return await self.update_one(
            "alerts",
            {"_id": alert_id, "child_id": child_id},
            {"read": True}
        )
    
    # Admin methods
    async def get_platform_stats(self) -> dict:
        """Get platform-wide statistics"""
        try:
            total_users = await self.count_documents("users")
            active_users = await self.count_documents("users", {"is_active": True})
            total_children = await self.count_documents("children")
            total_alerts = await self.count_documents("alerts")
            unread_alerts = await self.count_documents("alerts", {"read": False})

            # Get revenue this month
            revenue_this_month = await self.transactions.aggregate([
                {"$match": {"created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
            ]).to_list(length=1)
            revenue_this_month = revenue_this_month[0]["total"] if revenue_this_month else 0

            # Get new users this month
            new_users_this_month = await self.count_documents(
                "users", {"created_at": {"$gte": datetime.utcnow() - timedelta(days=30)}}
            )

            return {
                "total_users": total_users,
                "active_users": active_users,
                "total_children": total_children,
                "total_alerts": total_alerts,
                "unread_alerts": unread_alerts,
                "revenue_this_month": revenue_this_month,
                "new_users_this_month": new_users_this_month,
            }
        except Exception as e:
            logger.error(f"Error getting platform stats: {e}")
            return {}

    async def get_time_series_data(self, collection_name: str, time_range: str, 
                                   is_revenue: bool = False) -> List[Dict[str, Any]]:
        """Get time-series data for analytics"""
        today = datetime.utcnow()
        
        days = 0
        if time_range == '7d':
            days = 7
        elif time_range == '30d':
            days = 30
        elif time_range == '90d':
            days = 90
        elif time_range == 'all':
            days = 365

        query_filter = {
            'created_at': {
                '$gte': today - timedelta(days=days)
            }
        }

        group_by_format = "%Y-%m-%d"
        if days > 90:
            group_by_format = "%Y-%m"

        pipeline = [
            {'$match': query_filter},
            {'$group': {
                '_id': {'$dateToString': {'format': group_by_format, 'date': '$created_at'}},
                'count' if not is_revenue else 'total': {'$sum': 1 if not is_revenue else '$amount'}
            }},
            {'$sort': {'_id': 1}}
        ]

        try:
            collection = getattr(self.db, collection_name)
            results = await collection.aggregate(pipeline).to_list(length=None)
            return results
        except Exception as e:
            logger.error(f"Error getting time series data from {collection_name}: {e}")
            return []

    async def initialize_indexes(self):
        """Create database indexes for better performance"""
        try:
            # User indexes
            await self.users.create_index("email", unique=True)
            await self.users.create_index("google_id")
            
            # Child indexes
            await self.children.create_index("user_id")
            await self.children.create_index("device_id")
            
            # Monitoring data indexes
            await self.call_logs.create_index([("child_id", 1), ("timestamp", -1)])
            await self.messages.create_index([("child_id", 1), ("timestamp", -1)])
            await self.locations.create_index([("child_id", 1), ("timestamp", -1)])
            await self.app_usage.create_index([("child_id", 1), ("date", -1)])
            await self.web_history.create_index([("child_id", 1), ("timestamp", -1)])
            await self.alerts.create_index([("child_id", 1), ("read", 1), ("timestamp", -1)])

            # Token blacklist index with TTL
            await self.token_blacklist.create_index(
                "expires_at", expireAfterSeconds=0
            )
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")


# Global database instance
db = Database()