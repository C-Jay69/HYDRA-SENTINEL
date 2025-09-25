from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SubscriptionPlan(str, Enum):
    BASIC = "Basic"
    PREMIUM = "Premium"
    FAMILY = "Family"


class User(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    password: Optional[str] = None  # Hashed password
    name: str
    avatar: Optional[str] = None
    subscription: SubscriptionPlan = SubscriptionPlan.BASIC
    google_id: Optional[str] = None
    join_date: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "parent@example.com",
                "password": "securepassword",
                "name": "John Doe",
                "subscription": "Premium"
            }
        }


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    subscription: SubscriptionPlan = SubscriptionPlan.BASIC


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    subscription: Optional[SubscriptionPlan] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    google_token: str


class Child(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    name: str
    age: int
    avatar: Optional[str] = None
    device: str
    device_id: str
    status: str = "offline"  # online, offline
    last_seen: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class ChildCreate(BaseModel):
    name: str
    age: int
    avatar: Optional[str] = None
    device: str
    device_id: str


class ChildUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    avatar: Optional[str] = None
    device: Optional[str] = None
    status: Optional[str] = None