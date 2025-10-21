
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from auth_deps import get_current_user
from database import db
from models.admin import (
    DashboardStats,
    RevenueData,
    SignupsData,
    SubscriptionAnalytics,
    User,
    FinancialData,
)

router = APIRouter(prefix='/api/admin', tags=['Admin'])

# Dependency to verify admin user
async def verify_admin_user(token_payload: dict = Depends(get_current_user)):
    user = await db.find_one('users', {'_id': token_payload.get('user_id')})
    if not user or user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin privileges are required for this action.',
        )
    return user

@router.get("/stats/dashboard", response_model=DashboardStats, dependencies=[Depends(verify_admin_user)])
async def get_dashboard_stats():
    """Provides high-level statistics for the admin dashboard."""
    try:
        stats = await db.get_platform_stats()
        return DashboardStats(**stats)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard stats: {e}",
        )

@router.get("/analytics/revenue", response_model=List[RevenueData], dependencies=[Depends(verify_admin_user)])
async def get_revenue_analytics(timeRange: str = 'all'):
    """Provides time-series data for revenue analytics."""
    try:
        revenue_data = await db.get_time_series_data(
            'transactions', timeRange, is_revenue=True
        )
        return [RevenueData(date=item['_id'], revenue=item['total']) for item in revenue_data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to retrieve revenue data: {e}',
        )

@router.get("/analytics/signups", response_model=List[SignupsData], dependencies=[Depends(verify_admin_user)])
async def get_signups_analytics(timeRange: str = 'all'):
    """Provides time-series data for new user sign-ups."""
    try:
        signups_data = await db.get_time_series_data('users', timeRange)
        return [SignupsData(date=item['_id'], signups=item['count']) for item in signups_data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to retrieve signup data: {e}',
        )


@router.get("/analytics/subscriptions", response_model=SubscriptionAnalytics, dependencies=[Depends(verify_admin_user)])
async def get_subscription_analytics(timeRange: str = 'all'):
    """Provides a breakdown of subscription tiers for a given time range."""
    try:
        # This is a simplified example. A more robust implementation would involve
        # querying subscription events and calculating the breakdown for the time range.
        pipeline = [
            {'$group': {'_id': '$subscription', 'count': {'$sum': 1}}},
        ]
        results = await db.users.aggregate(pipeline).to_list(length=None)
        
        breakdown = {'Basic': 0, 'Premium': 0, 'Family': 0}
        for item in results:
            if item['_id'] in breakdown:
                breakdown[item['_id']] = item['count']

        return SubscriptionAnalytics(**breakdown)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Failed to retrieve subscription analytics: {e}',
        )

@router.get("/users", response_model=List[User], dependencies=[Depends(verify_admin_user)])
async def get_all_users():
    """Fetches a comprehensive list of all users and their associated children."""
    users_cursor = await db.find('users', {})
    users_data = []
    for user in users_cursor:
        # Exclude password hash from the response for security
        user.pop('password', None)
        
        # Fetch associated children for each user
        children_cursor = await db.find('children', {'user_id': str(user['_id'])})
        children_list = [child for child in children_cursor]
        
        # Convert ObjectId to string for JSON serialization
        for child in children_list:
            child['_id'] = str(child['_id'])
            
        user['children'] = children_list
        user['_id'] = str(user['_id'])
        users_data.append(user)
        
    return users_data

@router.get("/financials", response_model=FinancialData, dependencies=[Depends(verify_admin_user)])
async def get_financial_data():
    """Fetches financial data, including transactions and subscriptions."""
    transactions_cursor = await db.find("transactions", {})
    transactions = [doc for doc in transactions_cursor]
    for t in transactions:
        t["_id"] = str(t["_id"])
        
    subscriptions_cursor = await db.find("subscriptions", {})
    subscriptions = [doc for doc in subscriptions_cursor]
    for s in subscriptions:
        s['_id'] = str(s['_id'])
        
    return {"transactions": transactions, "subscriptions": subscriptions}

@router.get("/users/search", response_model=List[User], dependencies=[Depends(verify_admin_user)])
async def search_users(query: str = Query(..., min_length=1)):
    """Search for users by name or email."""
    try:
        users_cursor = await db.find("users", {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
            ]
        })
        users_data = []
        for user in users_cursor:
            user.pop("password", None)
            children_cursor = await db.find("children", {"user_id": str(user["_id"])})
            children_list = [child for child in children_cursor]
            for child in children_list:
                child["_id"] = str(child["_id"])
            user["children"] = children_list
            user["_id"] = str(user["_id"])
            users_data.append(user)
        return users_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search users: {e}",
        )

@router.get("/users/filter", response_model=List[User], dependencies=[Depends(verify_admin_user)])
async def filter_users(status: Optional[str] = None, plan: Optional[str] = None):
    """Filter users by subscription status or plan."""
    try:
        query = {}
        if status:
            query["is_active"] = status == "active"
        if plan:
            query["subscription"] = plan

        users_cursor = await db.find("users", query)
        users_data = []
        for user in users_cursor:
            user.pop("password", None)
            children_cursor = await db.find("children", {"user_id": str(user["_id"])})
            children_list = [child for child in children_cursor]
            for child in children_list:
                child["_id"] = str(child["_id"])
            user["children"] = children_list
            user["_id"] = str(user["_id"])
            users_data.append(user)
        return users_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to filter users: {e}",
        )

@router.put("/users/{user_id}/suspend", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_admin_user)])
async def suspend_user(user_id: str):
    """Suspend a user's account."""
    try:
        await db.update_one("users", {"_id": user_id}, {"is_active": False})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to suspend user: {e}",
        )

@router.put("/users/{user_id}/unsuspend", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(verify_admin_user)])
async def unsuspend_user(user_id: str):
    """Unsuspend a user's account."""
    try:
        await db.update_one("users", {"_id": user_id}, {"is_active": True})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unsuspend user: {e}",
        )
