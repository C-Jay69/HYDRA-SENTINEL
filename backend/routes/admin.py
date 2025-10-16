
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from datetime import datetime, timedelta

from auth_deps import get_current_user
from database import db

router = APIRouter(prefix="/api/admin", tags=["Admin"])

# Dependency to verify admin user
async def verify_admin_user(token_payload: dict = Depends(get_current_user)):
    user = await db.find_one("users", {"_id": token_payload.get("user_id")})
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges are required for this action.",
        )
    return user

@router.get("/stats/dashboard", response_model=Dict[str, Any], dependencies=[Depends(verify_admin_user)])
async def get_dashboard_stats():
    """Provides high-level statistics for the admin dashboard."""
    total_users = await db.count_documents("users", {})
    active_users = await db.count_documents("users", {"status": "active"})
    total_children = await db.count_documents("children", {})
    total_alerts = await db.count_documents("alerts", {})

    mock_stats = {
        "totalUsers": total_users,
        "activeUsers": active_users, 
        "totalChildren": total_children,
        "totalAlerts": total_alerts,
        "unreadAlerts": 15,
        "revenueThisMonth": 42580.50,
        "newUsersThisMonth": 98,
        "subscriptionBreakdown": {
          "Basic": (total_users * 0.6) if total_users else 0,
          "Premium": (total_users * 0.3) if total_users else 0,
          "Family": (total_users * 0.1) if total_users else 0
        }
    }
    return mock_stats

@router.get("/analytics/revenue", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_user)])
async def get_revenue_analytics(timeRange: str = 'all'):
    """Provides time-series data for revenue analytics."""
    revenue_data = []
    today = datetime.utcnow()
    
    days = 0
    if timeRange == '7d':
        days = 7
    elif timeRange == '30d':
        days = 30
    elif timeRange == '90d':
        days = 90
    elif timeRange == 'all':
        days = 365 # Default to 1 year for 'all'

    for i in range(days, 0, -1):
        date = today - timedelta(days=i)
        # Mock revenue data with some variability
        revenue = 200 + (i * 10) + ((-1)**i * 20)
        revenue_data.append({
            "date": date.strftime("%b %d"),
            "revenue": round(revenue, 2)
        })
            
    return revenue_data

@router.get("/analytics/signups", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_user)])
async def get_signups_analytics(timeRange: str = 'all'):
    """Provides time-series data for new user sign-ups."""
    signups_data = []
    today = datetime.utcnow()
    
    days = 0
    if timeRange == '7d':
        days = 7
    elif timeRange == '30d':
        days = 30
    elif timeRange == '90d':
        days = 90
    elif timeRange == 'all':
        days = 365  # Default to 1 year for 'all'

    if days > 0 and days <= 90:  # Daily data
        for i in range(days, 0, -1):
            date = today - timedelta(days=i)
            # Mocked daily signups
            signups = 15 + (i % 7) - ((-1)**(i//3) * 5)
            signups_data.append({
                "date": date.strftime("%b %d"),
                "signups": max(0, signups)
            })
    else:  # Monthly data for 'all'
        for i in range(12, 0, -1):
            month_date = today - timedelta(days=i * 30)
            # Mocked monthly signups
            signups = 150 + (i * 10) + ((-1)**i * 20)
            signups_data.append({
                "date": month_date.strftime("%b %Y"),
                "signups": signups
            })
            
    return signups_data

@router.get("/analytics/subscriptions", response_model=Dict[str, Any], dependencies=[Depends(verify_admin_user)])
async def get_subscription_analytics(timeRange: str = 'all'):
    """Provides a breakdown of subscription tiers for a given time range."""
    # Mock data based on time range
    if timeRange == '7d':
        return {"Basic": 5, "Premium": 3, "Family": 1}
    elif timeRange == '30d':
        return {"Basic": 25, "Premium": 15, "Family": 8}
    elif timeRange == '90d':
        return {"Basic": 80, "Premium": 50, "Family": 25}
    else: # all
        total_users = await db.count_documents("users", {})
        return {
            "Basic": total_users * 0.6,
            "Premium": total_users * 0.3,
            "Family": total_users * 0.1
        }

@router.get("/users", response_model=List[Dict[str, Any]], dependencies=[Depends(verify_admin_user)])
async def get_all_users():
    """Fetches a comprehensive list of all users and their associated children."""
    users_cursor = await db.find("users", {})
    users_data = []
    for user in users_cursor:
        # Exclude password hash from the response for security
        user.pop("password", None)
        
        # Fetch associated children for each user
        children_cursor = await db.find("children", {"user_id": str(user["_id"])})
        children_list = [child for child in children_cursor]
        
        # Convert ObjectId to string for JSON serialization
        for child in children_list:
            child["_id"] = str(child["_id"])
            
        user["children"] = children_list
        user["_id"] = str(user["_id"])
        users_data.append(user)
        
    return users_data

@router.get("/financials", response_model=Dict[str, Any], dependencies=[Depends(verify_admin_user)])
async def get_financial_data():
    """Fetches financial data, including transactions and subscriptions."""
    transactions_cursor = await db.find("transactions", {})
    transactions = [doc for doc in transactions_cursor]
    for t in transactions:
        t["_id"] = str(t["_id"])
        
    subscriptions_cursor = await db.find("subscriptions", {})
    subscriptions = [doc for doc in subscriptions_cursor]
    for s in subscriptions:
        s["_id"] = str(s["_id"])
        
    return {"transactions": transactions, "subscriptions": subscriptions}
