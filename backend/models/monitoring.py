from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CallLog(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    type: str  # incoming, outgoing
    contact: str
    number: str
    duration: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str  # answered, missed, rejected

    class Config:
        populate_by_name = True


class Message(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    type: str  # sms, whatsapp, telegram, etc.
    contact: str
    number: Optional[str] = None
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    direction: str  # incoming, outgoing

    class Config:
        populate_by_name = True


class Location(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    latitude: float
    longitude: float
    address: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    accuracy: int  # accuracy in meters

    class Config:
        populate_by_name = True


class AppUsage(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    name: str
    package_name: str
    icon: str
    category: str
    time_spent: str  # Format: HH:MM:SS
    launches: int
    last_used: Optional[datetime] = None
    blocked: bool = False
    time_limit: Optional[str] = None  # Format: HH:MM:SS
    exceeded: bool = False
    date: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class WebHistory(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    url: str
    title: str
    domain: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    category: str
    blocked: bool = False

    class Config:
        populate_by_name = True


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AlertType(str, Enum):
    LOCATION = "location"
    APP = "app"
    WEB = "web"
    TIME_LIMIT = "time_limit"
    CONTACT = "contact"


class Alert(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    
    # Optional contextual data
    location: Optional[dict] = None
    app: Optional[str] = None
    url: Optional[str] = None
    contact: Optional[str] = None

    class Config:
        populate_by_name = True


class Geofence(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    name: str
    latitude: float
    longitude: float
    radius: int  # radius in meters
    type: str  # safe, restricted
    active: bool = True
    notifications: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class Contact(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    name: str
    number: str
    email: Optional[str] = None
    relationship: str  # parent, friend, unknown, etc.
    blocked: bool = False
    emergency_contact: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ControlSettings(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    app_time_limits: dict = {}  # {app_package: time_limit}
    blocked_apps: List[str] = []  # List of package names
    blocked_websites: List[str] = []  # List of domains
    bedtime_restrictions: Optional[dict] = None  # {start_time, end_time}
    safe_search_enabled: bool = True
    location_tracking_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True