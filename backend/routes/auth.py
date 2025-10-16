from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from models.user import User, UserCreate, UserLogin, GoogleAuthRequest, SubscriptionPlan
from services.auth_service import AuthService
from database import db
from auth_deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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
        access_token = AuthService.create_access_.create_access_token(token_data)
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
async def get_user_profile(token_payload: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        from bson import ObjectId
        
        user_id = token_payload["user_id"]
        # Try both string and ObjectId formats
        user = await db.find_one("users", {"_id": user_id})
        if not user:
            # Try with ObjectId if string lookup fails
            try:
                user = await db.find_one("users", {"_id": ObjectId(user_id)})
            except:
                pass
        
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
async def logout(token_payload: dict = Depends(get_current_user)):
    """Logout user and blacklist token"""
    try:
        jti = token_payload.get("jti")
        if not jti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token cannot be blacklisted"
            )

        await db.add_to_blacklist(jti)
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.post("/request-password-reset", status_code=status.HTTP_200_OK)
async def request_password_reset(email_request: EmailRequest):
    """Request password reset"""
    try:
        user = await db.find_user_by_email(email_request.email)
        if not user:
            # Avoid user enumeration
            return {"message": "If an account with this email exists, a password reset link has been sent."}

        token = AuthService.create_password_reset_token(user["email"])
        
        # In a real application, you would send an email with this token
        # For this example, we'll just log it
        logger.info(f"Password reset token for {user['email']}: {token}")
        
        return {"message": "Password reset link has been sent to your email."}
        
    except Exception as e:
        logger.error(f"Password reset request error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to request password reset"
        )

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(reset_request: PasswordResetRequest):
    """Reset password"""
    try:
        # Verify password reset token
        payload = AuthService.verify_password_reset_token(reset_request.token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token"
            )
        
        user = await db.find_user_by_email(payload["email"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Hash new password
        hashed_password = AuthService.hash_password(reset_request.new_password)
        
        # Update password
        await db.update_one(
            "users",
            {"_id": user["_id"]},
            {"password": hashed_password}
        )
        
        return {"message": "Password has been reset successfully."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )
