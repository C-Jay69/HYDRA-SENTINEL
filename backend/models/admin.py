from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"


class AdminUserView(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: str
    name: str
    subscription: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    join_date: datetime
    last_login: Optional[datetime] = None
    children_count: int = 0
    total_alerts: int = 0
    is_active: bool = True

    class Config:
        populate_by_name = True


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    total_children: int
    total_alerts: int
    unread_alerts: int
    revenue_this_month: float
    revenue_last_month: float
    new_users_this_month: int
    subscription_breakdown: Dict[str, int]
    alert_types_breakdown: List[Dict[str, Any]]


class AlertOverview(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_name: str
    parent_name: str
    parent_email: str
    type: str
    severity: str
    title: str
    description: str
    timestamp: datetime
    read: bool = False

    class Config:
        populate_by_name = True


class RevenueMetrics(BaseModel):
    date: str
    revenue: float
    new_subscriptions: int
    churned_subscriptions: int
    plan_distribution: Dict[str, int]


class UserManagementAction(BaseModel):
    user_id: str
    action: str  # suspend, activate, upgrade, downgrade, delete
    reason: Optional[str] = None
    new_plan: Optional[str] = None


class SystemAlert(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    type: str  # system, security, billing, performance
    severity: str  # low, medium, high, critical
    title: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Config:
        populate_by_name = True