from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel

from app.schemas.models import SubscriptionCreate, ShippingAddress
from app.database.connection import (
    subscriptions_collection,
    orders_collection,
    products_collection,
    settings_collection,
    users_collection
)
from app.dependencies.auth_deps import get_current_user_email, get_admin_user

router = APIRouter(tags=["Subscriptions"])

# Status model for updates
class StatusUpdate(BaseModel):
    status: str

async def get_soap_base_price():
    prod = await products_collection.find_one({"id": "single"})
    if prod:
        return float(prod.get("basePrice", 299.0))
    return 299.0

async def get_discount_pct():
    settings = await settings_collection.find_one({"key": "site_settings"})
    if settings:
        return float(settings.get("subscription_discount_pct", 15.0))
    return 15.0

async def process_recurring_subscriptions():
    """
    Checks active subscriptions and automatically generates orders if the next delivery date has arrived/passed.
    """
    now = datetime.utcnow()
    # Find active subscriptions that are due for delivery
    active_subs = await subscriptions_collection.find({"status": "active"}).to_list(length=None)
    
    single_soap_price = await get_soap_base_price()
    discount_pct = await get_discount_pct()
    settings = await settings_collection.find_one({"key": "site_settings"})
    offers = settings.get("subscription_offers", []) if settings else []
    global_discount = float(settings.get("subscription_discount_pct", 15.0)) if settings else 15.0

    for sub in active_subs:
        next_del = sub.get("next_delivery_date")
        if isinstance(next_del, str):
            try:
                next_del = datetime.fromisoformat(next_del.replace("Z", "+00:00"))
            except ValueError:
                continue
        
        if next_del and next_del <= now:
            # Generate automated order
            short_uuid = str(uuid.uuid4()).split("-")[0].upper()
            order_id = f"SUB-AUTO-{short_uuid}"
            
            # Determine soaps quantity and total price
            soaps_qty = sub.get("soapsPerMonth", 2)
            freq = sub.get("deliveryFrequency", "monthly")
            
            # If every 3 months, quantity is multiplied by 3
            if freq == "every_3_months":
                soaps_qty = soaps_qty * 3
                
            # Find matching offer discount
            sub_discount = global_discount
            sub_duration = sub.get("durationMonths", 6)
            for offer in offers:
                if offer.get("durationMonths") == sub_duration and offer.get("deliveryFrequency") == freq and offer.get("active", True):
                    sub_discount = float(offer.get("discountPct", sub_discount))
                    break

            discount_factor = 1.0 - (sub_discount / 100.0)
            unit_price = single_soap_price * discount_factor
            pack_price = unit_price * soaps_qty
            
            cart_item = {
                "packId": "single",
                "title": f"Botanical Soap - Subscription ({sub.get('durationMonths')} Months)",
                "count": 1,
                "isSubscription": True,
                "frequency": "Every Month" if freq == "monthly" else "Every 3 Months",
                "unitPrice": f"{unit_price:.2f}",
                "packPrice": f"{pack_price:.2f}",
                "quantity": 1,
                "totalPrice": f"{pack_price:.2f}",
                "image": "/images/pack-single.png"
            }
            
            order_doc = {
                "orderId": order_id,
                "shippingAddress": sub.get("shippingAddress"),
                "cartItems": [cart_item],
                "subtotal": float(f"{pack_price:.2f}"),
                "discountAmount": 0.0,
                "shippingFee": 0.0,
                "grandTotal": float(f"{pack_price:.2f}"),
                "paymentMethod": sub.get("paymentMethod", "Cash on Delivery"),
                "created_at": now,
                "user_email": sub.get("user_email", ""),
                "isSubscriptionOrder": True,
                "subscriptionId": sub.get("subscriptionId")
            }
            
            # Save the generated order
            await orders_collection.insert_one(order_doc)
            
            # Update subscription remaining count and next delivery date
            remaining = sub.get("remaining_deliveries", 0) - 1
            new_status = "active"
            new_next_del = None
            
            if remaining <= 0:
                new_status = "completed"
            else:
                days_to_add = 90 if freq == "every_3_months" else 30
                new_next_del = next_del + timedelta(days=days_to_add)
            
            await subscriptions_collection.update_one(
                {"subscriptionId": sub.get("subscriptionId")},
                {
                    "$set": {
                        "remaining_deliveries": max(0, remaining),
                        "status": new_status,
                        "next_delivery_date": new_next_del
                    }
                }
            )

@router.post("/api/subscriptions/create", status_code=201)
async def create_subscription(sub_data: SubscriptionCreate, current_user_email: Optional[str] = Depends(get_current_user_email)):
    # Clean up and check recurring subscriptions first
    await process_recurring_subscriptions()
    
    email_to_use = current_user_email
    if not email_to_use and sub_data.customerEmail:
        email_to_use = sub_data.customerEmail.strip().lower()
        
    if email_to_use:
        existing_user = await users_collection.find_one({
            "$or": [
                {"email": email_to_use},
                {"mobile": sub_data.customerPhone}
            ]
        })
        if not existing_user:
            # Create user dynamically
            user_doc = {
                "name": sub_data.customerName,
                "email": email_to_use,
                "mobile": sub_data.customerPhone,
                "password": "",
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(user_doc)

    sub_id = f"SUB-{str(uuid.uuid4()).split('-')[0].upper()}"
    now = datetime.utcnow()
    
    # Calculate delivery schedules
    duration = sub_data.durationMonths
    freq = sub_data.deliveryFrequency
    
    if freq == "every_3_months":
        total_deliveries = duration // 3
        days_to_next = 90
    else:
        total_deliveries = duration
        days_to_next = 30
        
    next_del_date = now + timedelta(days=days_to_next)
    
    sub_doc = {
        "subscriptionId": sub_id,
        "user_email": email_to_use,
        "customerName": sub_data.customerName,
        "customerPhone": sub_data.customerPhone,
        "customerEmail": sub_data.customerEmail,
        "durationMonths": duration,
        "soapsPerMonth": sub_data.soapsPerMonth,
        "deliveryFrequency": freq,
        "shippingAddress": sub_data.shippingAddress.dict(),
        "paymentMethod": sub_data.paymentMethod,
        "status": "active",
        "created_at": now,
        "next_delivery_date": next_del_date,
        "remaining_deliveries": total_deliveries - 1, # First order is generated immediately
        "total_deliveries": total_deliveries
    }
    
    await subscriptions_collection.insert_one(sub_doc)
    
    # Generate the first order immediately
    single_soap_price = await get_soap_base_price()
    settings = await settings_collection.find_one({"key": "site_settings"})
    offers = settings.get("subscription_offers", []) if settings else []
    global_discount = float(settings.get("subscription_discount_pct", 15.0)) if settings else 15.0
    
    sub_discount = global_discount
    for offer in offers:
        if offer.get("durationMonths") == duration and offer.get("deliveryFrequency") == freq and offer.get("active", True):
            sub_discount = float(offer.get("discountPct", sub_discount))
            break
            
    discount_factor = 1.0 - (sub_discount / 100.0)
    
    soaps_qty = sub_data.soapsPerMonth
    if freq == "every_3_months":
        soaps_qty = soaps_qty * 3
        
    unit_price = single_soap_price * discount_factor
    pack_price = unit_price * soaps_qty
    
    cart_item = {
        "packId": "single",
        "title": f"Botanical Soap - Subscription ({duration} Months)",
        "count": 1,
        "isSubscription": True,
        "frequency": "Every Month" if freq == "monthly" else "Every 3 Months",
        "unitPrice": f"{unit_price:.2f}",
        "packPrice": f"{pack_price:.2f}",
        "quantity": 1,
        "totalPrice": f"{pack_price:.2f}",
        "image": "/images/pack-single.png"
    }
    
    order_id = f"SUB-FIRST-{str(uuid.uuid4()).split('-')[0].upper()}"
    order_doc = {
        "orderId": order_id,
        "shippingAddress": sub_data.shippingAddress.dict(),
        "cartItems": [cart_item],
        "subtotal": float(f"{pack_price:.2f}"),
        "discountAmount": 0.0,
        "shippingFee": 0.0,
        "grandTotal": float(f"{pack_price:.2f}"),
        "paymentMethod": sub_data.paymentMethod,
        "created_at": now,
        "user_email": email_to_use,
        "isSubscriptionOrder": True,
        "subscriptionId": sub_id
    }
    
    await orders_collection.insert_one(order_doc)
    
    sub_doc["_id"] = str(sub_doc["_id"])
    return {
        "status": "success",
        "subscription": sub_doc,
        "first_order": order_doc
    }

@router.get("/api/admin/subscriptions")
async def get_admin_subscriptions(admin: dict = Depends(get_admin_user)):
    await process_recurring_subscriptions()
    subs = await subscriptions_collection.find({}).to_list(length=None)
    for s in subs:
        s["_id"] = str(s["_id"])
    return subs

@router.put("/api/admin/subscriptions/{subscription_id}/status")
async def update_sub_status(subscription_id: str, status_data: StatusUpdate, admin: dict = Depends(get_admin_user)):
    existing = await subscriptions_collection.find_one({"subscriptionId": subscription_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    new_status = status_data.status
    update_fields = {"status": new_status}
    if new_status != "active":
        update_fields["next_delivery_date"] = None
        
    await subscriptions_collection.update_one(
        {"subscriptionId": subscription_id},
        {"$set": update_fields}
    )
    return {"status": "success", "message": f"Subscription status updated to {new_status}"}

@router.get("/api/user/subscriptions")
async def get_user_subscriptions(current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    await process_recurring_subscriptions()
    
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email.lower() if "@" in current_user_email else current_user_email},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    
    query = {"$or": [{"user_email": current_user_email}]}
    if user:
        emails = [current_user_email]
        mobiles = []
        if user.get("email"):
            emails.append(user["email"].lower())
        if user.get("mobile"):
            mobiles.append(user["mobile"])
            
        query = {
            "$or": [
                {"user_email": {"$in": emails}},
                {"customerEmail": {"$in": emails}},
                {"customerPhone": {"$in": mobiles}}
            ]
        }
        
    subs = await subscriptions_collection.find(query).to_list(length=None)
    for s in subs:
        s["_id"] = str(s["_id"])
    return subs

@router.post("/api/subscriptions/{subscription_id}/urgent", status_code=201)
async def request_urgent_delivery(subscription_id: str, current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    sub = await subscriptions_collection.find_one({"subscriptionId": subscription_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
        
    if sub.get("status") != "active":
        raise HTTPException(status_code=400, detail="Subscription is not active")
        
    single_soap_price = await get_soap_base_price()
    discount_pct = await get_discount_pct()
    discount_factor = 1.0 - (discount_pct / 100.0)
    
    # Urgent soap quantity is same as the regular monthly soap quantity
    soaps_qty = sub.get("soapsPerMonth", 2)
    
    unit_price = single_soap_price * discount_factor
    pack_price = unit_price * soaps_qty
    
    cart_item = {
        "packId": "single",
        "title": f"Botanical Soap - URGENT Subscription Order",
        "count": 1,
        "isSubscription": False,
        "frequency": None,
        "unitPrice": f"{unit_price:.2f}",
        "packPrice": f"{pack_price:.2f}",
        "quantity": 1,
        "totalPrice": f"{pack_price:.2f}",
        "image": "/images/pack-single.png"
    }
    
    now = datetime.utcnow()
    order_id = f"SUB-URGENT-{str(uuid.uuid4()).split('-')[0].upper()}"
    order_doc = {
        "orderId": order_id,
        "shippingAddress": sub.get("shippingAddress"),
        "cartItems": [cart_item],
        "subtotal": float(f"{pack_price:.2f}"),
        "discountAmount": 0.0,
        "shippingFee": 0.0,
        "grandTotal": float(f"{pack_price:.2f}"),
        "paymentMethod": "Cash on Delivery", # Or whatever subscription paymentMethod is
        "created_at": now,
        "user_email": current_user_email,
        "isUrgentOrder": True,
        "subscriptionId": subscription_id
    }
    
    await orders_collection.insert_one(order_doc)
    order_doc["_id"] = str(order_doc["_id"])
    
    # DO NOT deduct or change subscription remaining_deliveries or dates!
    return {
        "status": "success",
        "message": "Urgent order generated successfully",
        "order": order_doc
    }
