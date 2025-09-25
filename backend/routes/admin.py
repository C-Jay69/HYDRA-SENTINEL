from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
import logging
from datetime import datetime, timedelta

from models.admin import (
    AdminUserView, PlatformStats, AlertOverview, RevenueMetrics,
    UserManagementAction, SystemAlert, UserRole, UserStatus
)
from database import db
from auth_deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])


async def verify_admin_access(token_payload: dict):
    """Verify that the user has admin access"""
    user = await db.find_one("users", {"_id": token_payload["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user has admin role
    user_role = user.get("role", "user")
    if user_role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user


@router.get("/dashboard", response_model=PlatformStats)
async def get_admin_dashboard(token_payload: dict = Depends(get_current_user)):
    """Get admin dashboard statistics"""
    try:
        await verify_admin_access(token_payload)
        
        # Get platform statistics
        total_users = await db.count_documents("users")
        active_users = await db.count_documents("users", {"is_active": True})
        total_children = await db.count_documents("children")
        total_alerts = await db.count_documents("alerts")
        unread_alerts = await db.count_documents("alerts", {"read": False})
        
        # Calculate date ranges
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_last_month = (start_of_month - timedelta(days=1)).replace(day=1)
        
        # Get subscription breakdown
        users = await db.find_many("users", {})
        subscription_breakdown = {}
        for user in users:
            plan = user.get("subscription", "Basic")
            subscription_breakdown[plan] = subscription_breakdown.get(plan, 0) + 1
        
        # Get alert types breakdown
        alerts = await db.find_many("alerts", {})
        alert_types = {}
        for alert in alerts:
            alert_type = alert.get("type", "unknown")
            alert_types[alert_type] = alert_types.get(alert_type, 0) + 1
        
        alert_types_breakdown = [{"type": k, "count": v} for k, v in alert_types.items()]
        
        # Mock revenue calculation (in production, integrate with Stripe)
        revenue_this_month = len([u for u in users if u.get("subscription") == "Premium"]) * 69.99
        revenue_last_month = revenue_this_month * 0.85  # Mock data
        
        new_users_this_month = await db.count_documents(
            "users", 
            {"join_date": {"$gte": start_of_month}}
        )
        
        return PlatformStats(
            total_users=total_users,
            active_users=active_users,
            total_children=total_children,
            total_alerts=total_alerts,
            unread_alerts=unread_alerts,
            revenue_this_month=revenue_this_month,
            revenue_last_month=revenue_last_month,
            new_users_this_month=new_users_this_month,
            subscription_breakdown=subscription_breakdown,
            alert_types_breakdown=alert_types_breakdown
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get admin dashboard"
        )


@router.get("/users", response_model=List[AdminUserView])
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[UserStatus] = Query(None),
    subscription: Optional[str] = Query(None),
    token_payload: dict = Depends(get_current_user)
):
    """Get paginated list of users with admin details"""
    try:
        await verify_admin_access(token_payload)
        
        # Build filter query
        filter_query = {}
        if search:
            filter_query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        if status:
            if status == UserStatus.ACTIVE:
                filter_query["is_active"] = True
            elif status == UserStatus.SUSPENDED:
                filter_query["is_active"] = False
        
        if subscription:
            filter_query["subscription"] = subscription
        
        # Get paginated users
        skip = (page - 1) * limit
        users = await db.find_many(
            "users",
            filter_query,
            skip=skip,
            limit=limit,
            sort=[("join_date", -1)]
        )
        
        # Enhance user data with additional info
        admin_users = []
        for user in users:
            # Get children count
            children_count = await db.count_documents("children", {"user_id": user["_id"]})
            
            # Get alerts count
            total_alerts = await db.count_documents("alerts", {"child_id": {"$in": []}})
            
            admin_user = AdminUserView(
                **user,
                children_count=children_count,
                total_alerts=total_alerts,
                status=UserStatus.ACTIVE if user.get("is_active", True) else UserStatus.SUSPENDED
            )
            admin_users.append(admin_user)
        
        return admin_users
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )


@router.post("/users/{user_id}/action")
async def manage_user(
    user_id: str,
    action: UserManagementAction,
    token_payload: dict = Depends(get_current_user)
):
    """Perform management actions on users"""
    try:
        admin_user = await verify_admin_access(token_payload)
        
        # Get target user
        target_user = await db.find_one("users", {"_id": user_id})
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Perform action based on type
        update_data = {}
        
        if action.action == "suspend":
            update_data["is_active"] = False
        elif action.action == "activate":
            update_data["is_active"] = True
        elif action.action == "upgrade" or action.action == "downgrade":
            if not action.new_plan:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="New plan required for upgrade/downgrade"
                )
            update_data["subscription"] = action.new_plan
        elif action.action == "delete":
            # Delete user and all associated data
            await db.delete_one("users", {"_id": user_id})
            
            # Clean up user's children and monitoring data
            children = await db.find_many("children", {"user_id": user_id})
            child_ids = [child["_id"] for child in children]
            
            # Delete children and their monitoring data
            for child_id in child_ids:
                collections_to_clean = [
                    "call_logs", "messages", "locations", "app_usage",
                    "web_history", "alerts", "geofences", "contacts", "control_settings"
                ]
                for collection in collections_to_clean:
                    await db.db[collection].delete_many({"child_id": child_id})
            
            await db.db.children.delete_many({"user_id": user_id})
            
            return {"message": f"User {target_user['email']} deleted successfully"}
        
        # Update user if not deleting
        if update_data:
            success = await db.update_one("users", {"_id": user_id}, update_data)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update user"
                )
        
        # Log admin action
        await db.create_one("admin_actions", {
            "admin_id": admin_user["_id"],
            "admin_email": admin_user["email"],
            "action": action.action,
            "target_user_id": user_id,
            "target_user_email": target_user["email"],
            "reason": action.reason,
            "timestamp": datetime.utcnow()
        })
        
        return {"message": f"Action '{action.action}' completed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User management error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform user action"
        )


@router.get("/alerts", response_model=List[AlertOverview])
async def get_admin_alerts(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    token_payload: dict = Depends(get_current_user)
):
    """Get system-wide alert overview for admins"""
    try:
        await verify_admin_access(token_payload)
        
        # Build filter query
        filter_query = {}
        if severity:
            filter_query["severity"] = severity
        if alert_type:
            filter_query["type"] = alert_type
        if unread_only:
            filter_query["read"] = False
        
        # Get alerts
        alerts = await db.find_many(
            "alerts",
            filter_query,
            limit=limit,
            sort=[("timestamp", -1)]
        )
        
        # Enhance with parent/child info
        alert_overviews = []
        for alert in alerts:
            # Get child info
            child = await db.find_one("children", {"_id": alert["child_id"]})
            if not child:
                continue
            
            # Get parent info
            parent = await db.find_one("users", {"_id": child["user_id"]})
            if not parent:
                continue
            
            alert_overview = AlertOverview(
                **alert,
                child_name=child["name"],
                parent_name=parent["name"],
                parent_email=parent["email"]
            )
            alert_overviews.append(alert_overview)
        
        return alert_overviews
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin alerts error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get admin alerts"
        )


@router.get("/revenue")
async def get_revenue_metrics(
    days: int = Query(30, ge=1, le=365),
    token_payload: dict = Depends(get_current_user)
):
    """Get revenue analytics"""
    try:
        await verify_admin_access(token_payload)
        
        # Mock revenue data (in production, integrate with Stripe)
        revenue_data = []
        for i in range(days):
            date = datetime.utcnow() - timedelta(days=i)
            revenue_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "revenue": 2500 + (i * 50),  # Mock growing revenue
                "new_subscriptions": 5 + (i % 3),
                "churned_subscriptions": 1 + (i % 2),
                "plan_distribution": {
                    "Basic": 20 + (i % 5),
                    "Premium": 35 + (i % 7),
                    "Family": 10 + (i % 3)
                }
            })
        
        return {"revenue_metrics": revenue_data[::-1]}  # Reverse for chronological order
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revenue metrics error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revenue metrics"
        )


@router.post("/system-alert")
async def create_system_alert(
    alert: SystemAlert,
    token_payload: dict = Depends(get_current_user)
):
    """Create a system-wide alert"""
    try:
        await verify_admin_access(token_payload)
        
        alert_dict = alert.dict()
        alert_id = await db.create_one("system_alerts", alert_dict)
        
        return {"message": "System alert created", "alert_id": alert_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create system alert error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create system alert"
        )