
import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock
from backend.auth_deps import get_current_user
from fastapi.security import HTTPAuthorizationCredentials

# --- Async Mock Helper ---
def async_return(result):
    import asyncio
    f = asyncio.Future()
    f.set_result(result)
    return f

# --- Fixtures ---
@pytest.fixture
def mock_auth_service():
    with patch('backend.auth_deps.AuthService') as mock_service:
        yield mock_service

@pytest.fixture
def mock_db():
    with patch('backend.auth_deps.db') as mock_db_instance:
        yield mock_db_instance

# --- Tests ---
@pytest.mark.asyncio
async def test_get_current_user_success(mock_auth_service, mock_db):
    """Test successful user retrieval from a valid token."""
    mock_token = "valid.token.here"
    mock_payload = {"user_id": "test_user", "jti": "test_jti"}
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=mock_token)

    mock_auth_service.verify_token.return_value = mock_payload
    mock_db.is_blacklisted.return_value = async_return(False)

    payload = await get_current_user(credentials)

    assert payload == mock_payload
    mock_auth_service.verify_token.assert_called_once_with(mock_token)
    mock_db.is_blacklisted.assert_called_once_with("test_jti")

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mock_auth_service):
    """Test that an invalid token raises an HTTPException."""
    mock_token = "invalid.token.here"
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=mock_token)

    mock_auth_service.verify_token.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid or expired token"

@pytest.mark.asyncio
async def test_get_current_user_blacklisted_token(mock_auth_service, mock_db):
    """Test that a blacklisted token raises an HTTPException."""
    mock_token = "blacklisted.token.here"
    mock_payload = {"user_id": "test_user", "jti": "blacklisted_jti"}
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=mock_token)

    mock_auth_service.verify_token.return_value = mock_payload
    mock_db.is_blacklisted.return_value = async_return(True)

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token has been revoked"

@pytest.mark.asyncio
async def test_get_current_user_no_jti_in_payload(mock_auth_service, mock_db):
    """Test that a payload without a 'jti' raises an HTTPException."""
    mock_token = "valid.token.no.jti"
    mock_payload = {"user_id": "test_user"} # No 'jti' here
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=mock_token)

    mock_auth_service.verify_token.return_value = mock_payload

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials)
    
    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Token has been revoked"
    # Ensure is_blacklisted is not called if jti is missing
    mock_db.is_blacklisted.assert_not_called()
