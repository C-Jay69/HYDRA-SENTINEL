
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

# Analytics Models
class RevenueData(BaseModel):
    date: str
    revenue: float

class SignupsData(BaseModel):
    date: str
    signups: int

class SubscriptionAnalytics(BaseModel):
    basic: int = Field(..., alias="Basic")
    premium: int = Field(..., alias="Premium")
    family: int = Field(..., alias="Family")

# User Management Models
class Child(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    device_id: str

class User(BaseModel):
    id: str = Field(..., alias="_id")
    email: str
    username: str
    status: str
    subscription_plan: str
    children: List[Child] = []

# Financial Models
class Transaction(BaseModel):
    id: str = Field(..., alias="_id")
    # Add other transaction fields as needed

class Subscription(BaseModel):
    id: str = Field(..., alias="_id")
    # Add other subscription fields as needed

class FinancialData(BaseModel):
    transactions: List[Transaction]
    subscriptions: List[Subscription]

# Dashboard Models
class DashboardStats(BaseModel):
    totalUsers: int
    activeUsers: int
    totalChildren: int
    totalAlerts: int
    unreadAlerts: int
    revenueThisMonth: float
    newUsersThisMonth: int
    subscriptionBreakdown: Dict[str, float]
