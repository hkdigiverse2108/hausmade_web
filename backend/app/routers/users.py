from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.models import UserUpdate, UpdateCartRequest
from app.database.connection import users_collection, orders_collection
from app.dependencies.auth_deps import get_current_user_email, get_admin_user
from app.security.auth import hash_password, verify_password

router = APIRouter(tags=["Users & Admin"])

@router.get("/api/user/profile")
async def get_profile(current_user_email: str = Depends(get_current_user_email)):
    print(f"\n[DIAGNOSTIC] get_profile called. current_user_email: '{current_user_email}'")
    try:
        all_users = await users_collection.find({}).to_list(length=None)
        print(f"[DIAGNOSTIC] Total users in DB: {len(all_users)}")
        for u in all_users:
            print(f"  - User: id={u.get('_id')}, name='{u.get('name')}', email='{u.get('email')}', mobile='{u.get('mobile')}', auth0_sub='{u.get('auth0_sub')}'")
    except Exception as e:
        print(f"[DIAGNOSTIC] Error fetching users list: {e}")
        
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    
    if not user:
        print(f"[DIAGNOSTIC] User NOT found in database for email/mobile/sub '{current_user_email}'")
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "status": "success",
        "user": {
            "name": user["name"],
            "email": user.get("email", ""),
            "mobile": user.get("mobile", ""),
            "address_line1": user.get("address_line1", ""),
            "address_line2": user.get("address_line2", ""),
            "city": user.get("city", ""),
            "state": user.get("state", ""),
            "zip_code": user.get("zip_code", ""),
            "country": user.get("country", ""),
            "addresses": user.get("addresses", []),
            "is_admin": user.get("is_admin", False),
            "cart": user.get("cart", []),
            "cart_updated_at": str(user.get("cart_updated_at")) if user.get("cart_updated_at") else ""
        }
    }


@router.post("/api/user/update")
async def update_profile(user_data: UserUpdate, current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_doc = {}
    if user_data.name is not None:
        update_doc["name"] = user_data.name
    if user_data.email is not None:
        new_email = user_data.email.lower()
        if new_email != user.get("email"):
            existing = await users_collection.find_one({"email": new_email})
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_doc["email"] = new_email
    if user_data.mobile is not None:
        if user_data.mobile != user.get("mobile"):
            existing = await users_collection.find_one({"mobile": user_data.mobile})
            if existing:
                raise HTTPException(status_code=400, detail="Mobile number already in use")
            update_doc["mobile"] = user_data.mobile
            
    for field in ["address_line1", "address_line2", "city", "state", "zip_code", "country"]:
        val = getattr(user_data, field)
        if val is not None:
            update_doc[field] = val

    if user_data.addresses is not None:
        update_doc["addresses"] = [addr.dict() for addr in user_data.addresses]

    if user_data.password is not None:
        if not user_data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to change password")
        
        if user.get("password"):
            if not verify_password(user_data.current_password, user["password"]):
                raise HTTPException(status_code=400, detail="Incorrect current password")
        
        update_doc["password"] = hash_password(user_data.password)
            
    if update_doc:
        await users_collection.update_one({"_id": user["_id"]}, {"$set": update_doc})
        
    updated_user = await users_collection.find_one({"_id": user["_id"]})
    return {
        "status": "success",
        "user": {
            "name": updated_user["name"],
            "email": updated_user.get("email", ""),
            "mobile": updated_user.get("mobile", ""),
            "address_line1": updated_user.get("address_line1", ""),
            "address_line2": updated_user.get("address_line2", ""),
            "city": updated_user.get("city", ""),
            "state": updated_user.get("state", ""),
            "zip_code": updated_user.get("zip_code", ""),
            "country": updated_user.get("country", ""),
            "addresses": updated_user.get("addresses", []),
            "is_admin": updated_user.get("is_admin", False)
        }
    }

@router.get("/api/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    orders = await orders_collection.find({}).to_list(length=None)
    users = await users_collection.find({}).to_list(length=None)
    
    total_revenue = 0.0
    for order in orders:
        try:
            total_revenue += float(order.get("grandTotal", 0.0))
        except (ValueError, TypeError):
            pass
            
    order_count = len(orders)
    customer_count = sum(1 for u in users if not u.get("is_admin"))
    average_order_value = total_revenue / order_count if order_count > 0 else 0.0
    
    return {
        "total_revenue": total_revenue,
        "order_count": order_count,
        "customer_count": customer_count,
        "average_order_value": average_order_value
    }

@router.get("/api/admin/users")
async def get_admin_users(admin: dict = Depends(get_admin_user)):
    users = await users_collection.find({}).to_list(length=None)
    cleaned_users = []
    for user in users:
        cleaned_users.append({
            "id": str(user.get("_id")),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "mobile": user.get("mobile", ""),
            "is_admin": user.get("is_admin", False),
            "created_at": str(user.get("created_at", ""))
        })
    return cleaned_users

@router.get("/api/admin/recent-users")
async def get_admin_recent_users(admin: dict = Depends(get_admin_user)):
    users = await users_collection.find({}).to_list(length=None)
    customers = [u for u in users if not u.get("is_admin")]
    try:
        customers.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    except Exception:
        pass
    
    recent = []
    for u in customers[:5]:
        recent.append({
            "id": str(u.get("_id")),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "mobile": u.get("mobile", ""),
            "created_at": str(u.get("created_at", ""))
        })
    return recent

@router.get("/api/admin/orders")
async def get_admin_orders(admin: dict = Depends(get_admin_user)):
    orders = await orders_collection.find({}).to_list(length=None)
    for order in orders:
        order["_id"] = str(order["_id"])
    try:
        orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    except Exception:
        pass
    return orders

@router.get("/api/admin/subscriptions")
async def get_admin_subscriptions(admin: dict = Depends(get_admin_user)):
    orders = await orders_collection.find({}).to_list(length=None)
    subscriptions = []
    for o in orders:
        cart_items = o.get("cartItems", [])
        sub_items = [item for item in cart_items if item.get("isSubscription")]
        if sub_items:
            for item in sub_items:
                subscriptions.append({
                    "orderId": o.get("orderId"),
                    "dbId": str(o.get("_id")),
                    "customerName": o.get("shippingAddress", {}).get("fullName", "Customer"),
                    "email": o.get("shippingAddress", {}).get("email", o.get("user_email", "")),
                    "phone": o.get("shippingAddress", {}).get("phone", ""),
                    "productTitle": item.get("title", "Botanical Soap"),
                    "packId": item.get("packId"),
                    "quantity": item.get("quantity", 1),
                    "frequency": item.get("frequency", "monthly"),
                    "status": o.get("subscription_status", "active"),
                    "created_at": str(o.get("created_at", ""))
                })
    return subscriptions

@router.put("/api/admin/subscriptions/{order_id}/status")
async def update_subscription_status(order_id: str, payload: dict, admin: dict = Depends(get_admin_user)):
    new_status = payload.get("status")
    if new_status not in ["active", "paused", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid subscription status")
        
    # Search by orderId first
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        # Try finding by MongoDB ID
        from bson import ObjectId
        try:
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        except Exception:
            try:
                order = await orders_collection.find_one({"_id": order_id})
            except Exception:
                pass
                
    if not order:
        raise HTTPException(status_code=404, detail="Order matching subscription not found")
        
    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": {"subscription_status": new_status}}
    )
    return {"status": "success", "message": f"Subscription status updated to {new_status}"}

@router.post("/api/user/cart")
async def update_cart(cart_data: UpdateCartRequest, current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Convert cart items to list of dicts
    cart_list = [item.dict() for item in cart_data.cartItems]
    
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "cart": cart_list,
            "cart_updated_at": datetime.utcnow()
        }}
    )
    return {"status": "success", "message": "Cart synchronized successfully"}

@router.get("/api/admin/active-carts")
async def get_admin_active_carts(admin: dict = Depends(get_admin_user)):
    # Find all users with a non-empty cart array
    users_with_carts = await users_collection.find({
        "cart": {"$exists": True, "$ne": []}
    }).to_list(length=None)
    
    active_carts = []
    for u in users_with_carts:
        # Check how many orders they've placed
        user_email = u.get("email", "")
        user_mobile = u.get("mobile", "")
        
        order_query = []
        if user_email:
            order_query.append({"user_email": user_email})
            order_query.append({"shippingAddress.email": user_email})
        if user_mobile:
            order_query.append({"shippingAddress.phone": user_mobile})
            
        order_count = 0
        if order_query:
            order_count = await orders_collection.count_documents({"$or": order_query})
            
        active_carts.append({
            "id": str(u.get("_id")),
            "name": u.get("name") or "Guest Customer",
            "email": user_email,
            "mobile": user_mobile,
            "cart": u.get("cart", []),
            "cart_updated_at": str(u.get("cart_updated_at")) if u.get("cart_updated_at") else "",
            "order_count": order_count
        })
        
    return active_carts

