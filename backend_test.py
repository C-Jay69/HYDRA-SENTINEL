
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import asyncio

from backend.main import app
from backend.auth_deps import get_current_user

# --- Test Client Fixture ---
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# --- Mocking Utilities ---
def async_return(result):
    """Helper to return an awaitable result."""
    f = asyncio.Future()
    f.set_result(result)
    return f

# Mock user payloads for dependency overrides
mock_admin_payload = {"user_id": "admin_user_id", "role": "admin"}
mock_user_payload = {"user_id": "test_user_id", "role": "user"}

async def override_get_current_user_as_admin():
    return mock_admin_payload

async def override_get_current_user_as_user():
    return mock_user_payload

# --- Root Endpoint Test ---
def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "GuardianApp API is running."}

# --- Admin Routes Tests ---
@patch('backend.routes.admin.db')
def test_admin_routes_unauthorized(mock_db, client):
    app.dependency_overrides[get_current_user] = override_get_current_user_as_user
    mock_db.find_one.return_value = async_return({"_id": "test_user_id", "role": "user"})

    admin_endpoints = [
        "/api/admin/stats/dashboard", "/api/admin/analytics/revenue",
        "/api/admin/analytics/signups", "/api/admin/analytics/subscriptions",
        "/api/admin/users", "/api/admin/financials"
    ]
    for endpoint in admin_endpoints:
        response = client.get(endpoint)
        assert response.status_code == 403

    app.dependency_overrides = {}

@patch('backend.routes.admin.db')
def test_get_financials_authorized(mock_db, client):
    """Test financials endpoint as an admin."""
    app.dependency_overrides[get_current_user] = override_get_current_user_as_admin
    mock_db.find_one.return_value = async_return({"_id": "admin_user_id", "role": "admin"})

    # Mock database find results
    mock_transactions = asyncio.Future()
    mock_transactions.set_result([{"_id": "t1", "amount": 10.0}])
    mock_subscriptions = asyncio.Future()
    mock_subscriptions.set_result([{"_id": "s1", "plan": "Premium"}])

    mock_db.find.side_effect = [mock_transactions, mock_subscriptions]

    response = client.get("/api/admin/financials")
    assert response.status_code == 200
    data = response.json()
    assert "transactions" in data
    assert "subscriptions" in data
    assert len(data["transactions"]) == 1
    assert len(data["subscriptions"]) == 1

    app.dependency_overrides = {}
