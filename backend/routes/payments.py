from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
import logging
import os

from database import db
from auth_deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Stripe configuration (add your keys to .env)
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_...')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_...')


class CreateCheckoutSession(BaseModel):
    plan_id: str
    success_url: str
    cancel_url: str


class WebhookEvent(BaseModel):
    type: str
    data: dict


@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY
    }


@router.post("/create-checkout-session")
async def create_checkout_session(
    session_data: CreateCheckoutSession,
    token_payload: dict = Depends(get_current_user)
):
    """Create Stripe checkout session"""
    try:
        # Get user
        user = await db.find_one("users", {"_id": token_payload["user_id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Plan pricing (in production, store this in database)
        plans = {
            "basic": {"price": 2999, "name": "Basic Plan"},  # $29.99 in cents
            "premium": {"price": 6999, "name": "Premium Plan"},  # $69.99 in cents
            "family": {"price": 9999, "name": "Family Plan"}  # $99.99 in cents
        }

        if session_data.plan_id not in plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan ID"
            )

        plan = plans[session_data.plan_id]

        # In production, integrate with Stripe SDK:
        # import stripe
        # stripe.api_key = STRIPE_SECRET_KEY
        # 
        # checkout_session = stripe.checkout.Session.create(
        #     payment_method_types=['card'],
        #     line_items=[{
        #         'price_data': {
        #             'currency': 'usd',
        #             'product_data': {
        #                 'name': plan['name'],
        #             },
        #             'unit_amount': plan['price'],
        #             'recurring': {
        #                 'interval': 'month',
        #             },
        #         },
        #         'quantity': 1,
        #     }],
        #     mode='subscription',
        #     customer_email=user['email'],
        #     success_url=session_data.success_url,
        #     cancel_url=session_data.cancel_url,
        #     metadata={
        #         'user_id': user['_id'],
        #         'plan_id': session_data.plan_id
        #     }
        # )
        # 
        # return {"checkout_url": checkout_session.url}

        # Mock implementation for demo
        logger.info(f"Creating checkout session for user {user['email']} - Plan: {session_data.plan_id}")
        
        return {
            "checkout_url": f"https://checkout.stripe.com/mock?plan={session_data.plan_id}&user={user['_id']}",
            "session_id": f"cs_test_mock_{user['_id']}_{session_data.plan_id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create checkout session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/webhook")
async def stripe_webhook(webhook_data: WebhookEvent):
    """Handle Stripe webhook events"""
    try:
        # In production, verify webhook signature:
        # import stripe
        # endpoint_secret = os.environ.get('STRIPE_ENDPOINT_SECRET')
        # 
        # try:
        #     event = stripe.Webhook.construct_event(
        #         payload, sig_header, endpoint_secret
        #     )
        # except ValueError as e:
        #     # Invalid payload
        #     raise HTTPException(status_code=400, detail="Invalid payload")
        # except stripe.error.SignatureVerificationError as e:
        #     # Invalid signature
        #     raise HTTPException(status_code=400, detail="Invalid signature")

        event_type = webhook_data.type
        
        if event_type == 'checkout.session.completed':
            # Payment successful - update user subscription
            session = webhook_data.data.get('object', {})
            user_id = session.get('metadata', {}).get('user_id')
            plan_id = session.get('metadata', {}).get('plan_id')
            
            if user_id and plan_id:
                # Update user subscription
                plan_names = {
                    "basic": "Basic",
                    "premium": "Premium", 
                    "family": "Family"
                }
                
                await db.update_one(
                    "users",
                    {"_id": user_id},
                    {"subscription": plan_names.get(plan_id, "Basic")}
                )
                
                logger.info(f"Updated subscription for user {user_id} to {plan_id}")

        elif event_type == 'customer.subscription.deleted':
            # Subscription cancelled - downgrade user
            subscription = webhook_data.data.get('object', {})
            customer_id = subscription.get('customer')
            
            # Find user by Stripe customer ID and downgrade
            # Implementation depends on how you store customer IDs
            
        elif event_type == 'invoice.payment_failed':
            # Payment failed - notify user or suspend account
            invoice = webhook_data.data.get('object', {})
            # Handle failed payment
            
        return {"received": True}

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


@router.get("/subscription-status")
async def get_subscription_status(token_payload: dict = Depends(get_current_user)):
    """Get user's current subscription status"""
    try:
        user = await db.find_one("users", {"_id": token_payload["user_id"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # In production, fetch from Stripe:
        # import stripe
        # stripe.api_key = STRIPE_SECRET_KEY
        # 
        # if user.get('stripe_customer_id'):
        #     subscriptions = stripe.Subscription.list(
        #         customer=user['stripe_customer_id'],
        #         status='active'
        #     )
        #     # Process subscription data

        # Mock subscription status
        return {
            "subscription": user.get("subscription", "Basic"),
            "status": "active",
            "current_period_end": "2024-10-01",
            "cancel_at_period_end": False,
            "billing_cycle_anchor": "2024-09-01"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get subscription status error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription status"
        )