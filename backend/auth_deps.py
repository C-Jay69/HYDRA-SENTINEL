from fastapi import HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import AuthService
from database import db

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current user from JWT token"""
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired token',
        )
    
    # Check if token is blacklisted
    jti = payload.get('jti')
    if not jti or db.is_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token has been revoked',
        )
        
    return payload

async def get_current_user_id(request: Request) -> str:
    """Get current user ID from token for rate limiting"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return request.client.host
        
        token = auth_header.split(" ")[1]
        payload = AuthService.verify_token(token)
        
        if not payload or not payload.get("user_id"):
            return request.client.host
        
        return payload["user_id"]
    except Exception:
        return request.client.host
