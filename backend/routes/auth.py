from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from models.user import User, UserCreate, UserLogin, GoogleAuthRequest, SubscriptionPlan
from services.auth_service import AuthService
from database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    return payload


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.find_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        hashed_password = AuthService.hash_password(user_data.password)
        
        # Create user document
        user_dict = {
            "email": user_data.email,
            "password": hashed_password,
            "name": user_data.name,
            "subscription": user_data.subscription.value,
            "is_active": True
        }
        
        # Insert user into database
        user_id = await db.create_user(user_dict)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Create tokens
        token_data = {"user_id": user_id, "email": user_data.email}
        access_token = AuthService.create_access_token(token_data)
        refresh_token = AuthService.create_refresh_token(token_data)
        
        # Update last login
        await db.update_one("users", {"_id": user_id}, {"last_login": datetime.utcnow()})
        
        # Prepare user response (without password)
        user_response = {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "subscription": user_data.subscription.value,
            "is_active": True
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user with email and password"""
    try:
        # Find user by email
        user = await db.find_user_by_email(credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not AuthService.verify_password(credentials.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Create tokens
        token_data = {"user_id": user["_id"], "email": user["email"]}
        access_token = AuthService.create_access_token(token_data)
        refresh_token = AuthService.create_refresh_token(token_data)
        
        # Update last login
        await db.update_one("users", {"_id": user["_id"]}, {"last_login": datetime.utcnow()})
        
        # Prepare user response (without password)
        user_response = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "Basic"),
            "avatar": user.get("avatar"),
            "is_active": user.get("is_active", True)
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/google", response_model=TokenResponse)
async def google_auth(auth_request: GoogleAuthRequest):
    """Authenticate user with Google OAuth token"""
    try:
        # Verify Google token
        google_user = AuthService.verify_google_token(auth_request.google_token)
        if not google_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token"
            )
        
        # Check if user exists by Google ID
        user = await db.find_user_by_google_id(google_user["google_id"])
        
        if not user:
            # Check if user exists by email
            user = await db.find_user_by_email(google_user["email"])
            
            if user:
                # Link Google account to existing user
                await db.update_one(
                    "users",
                    {"_id": user["_id"]},
                    {"google_id": google_user["google_id"], "avatar": google_user["avatar"]}
                )
            else:
                # Create new user
                user_dict = {
                    "email": google_user["email"],
                    "name": google_user["name"],
                    "google_id": google_user["google_id"],
                    "avatar": google_user["avatar"],
                    "subscription": SubscriptionPlan.BASIC.value,
                    "is_active": True
                }
                
                user_id = await db.create_user(user_dict)
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create user"
                    )
                
                # Fetch the created user
                user = await db.find_one("users", {"_id": user_id})
        
        # Create tokens
        token_data = {"user_id": user["_id"], "email": user["email"]}
        access_token = AuthService.create_access_token(token_data)
        refresh_token = AuthService.create_refresh_token(token_data)
        
        # Update last login
        await db.update_one("users", {"_id": user["_id"]}, {"last_login": datetime.utcnow()})
        
        # Prepare user response
        user_response = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "Basic"),
            "avatar": user.get("avatar"),
            "is_active": user.get("is_active", True)
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        # Verify refresh token
        payload = AuthService.verify_token(token_request.refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user from database
        user = await db.find_one("users", {"_id": payload["user_id"]})
        if not user or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or deactivated"
            )
        
        # Create new tokens
        token_data = {"user_id": user["_id"], "email": user["email"]}
        new_access_token = AuthService.create_access_token(token_data)
        new_refresh_token = AuthService.create_refresh_token(token_data)
        
        # Prepare user response
        user_response = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "Basic"),
            "avatar": user.get("avatar"),
            "is_active": user.get("is_active", True)
        }
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.get("/me")
async def get_current_user(token_payload: dict = Depends(jwt_bearer)):
    """Get current user profile"""
    try:
        user = await db.find_one("users", {"_id": token_payload["user_id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare user response (without password)
        user_response = {
            "id": user["_id"],
            "email": user["email"],
            "name": user["name"],
            "subscription": user.get("subscription", "Basic"),
            "avatar": user.get("avatar"),
            "join_date": user.get("join_date"),
            "is_active": user.get("is_active", True)
        }
        
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get user error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.post("/logout")
async def logout(token_payload: dict = Depends(jwt_bearer)):
    """Logout user (invalidate token on client side)"""
    return {"message": "Successfully logged out"}