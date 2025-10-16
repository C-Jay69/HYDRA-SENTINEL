from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime, time
from enum import Enum

# --- New Schedule Model ---
class DayOfWeek(str, Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class ScreenTimeSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "New Schedule"
    days: List[DayOfWeek] = []
    start_time: time = Field(default_factory=lambda: time(9, 0))
    end_time: time = Field(default_factory=lambda: time(17, 0))
    is_enabled: bool = True

    @validator('start_time', 'end_time', pre=True, always=True)
    def parse_time(cls, v):
        if isinstance(v, str):
            return time.fromisoformat(v)
        return v

# --- Existing ControlSettings Model (Updated) ---

class ControlSettings(BaseModel):
    child_id: str
    blocked_apps: List[str] = []
    blocked_websites: List[str] = []
    app_time_limits: dict = {}
    screen_time_schedules: List[ScreenTimeSchedule] = [] # New field for schedules

    class Config:
        populate_by_name = True

# --- Other Existing Models ---

class CallLog(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    type: str
    contact: str
    number: str
    duration: str
    timestamp: datetime
    class Config: populate_by_name = True

class Message(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    address: str
    body: str
    date: str
    type: str
    read: bool
    class Config: populate_by_name = True

class Location(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: float
    class Config: populate_by_name = True

class AppUsage(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    package_name: str
    app_name: str
    total_time: int
    last_used: datetime
    class Config: populate_by_name = True

class WebHistory(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    url: str
    title: str
    timestamp: datetime
    class Config: populate_by_name = True

class SocialMediaActivity(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    child_id: str
    app: str
    packageName: str
    eventType: str
    content: dict[str, Any]
    timestamp: datetime
    class Config: populate_by_name = True

class Alert(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    type: str
    message: str
    severity: str
    timestamp: datetime
    read: bool = False
    class Config: populate_by_name = True

class Geofence(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    name: str
    latitude: float
    longitude: float
    radius: int
    active: bool = True
    class Config: populate_by_name = True

class Contact(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    child_id: str
    name: str
    phone_numbers: List[str]
    class Config: populate_by_name = True
