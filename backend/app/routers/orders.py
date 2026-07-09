from typing import Optional
from datetime import datetime
import uuid
import httpx
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.models import OrderCreate, OfflineSaleCreate
from app.database.connection import orders_collection, products_collection, users_collection, settings_collection
from app.dependencies.auth_deps import get_current_user_email, get_admin_user

router = APIRouter(tags=["Orders"])

@router.post("/api/orders", status_code=201)
async def place_order(order_data: OrderCreate, current_user_email: Optional[str] = Depends(get_current_user_email)):
    for item in order_data.cartItems:
        prod = await products_collection.find_one({"id": item.packId})
        if prod:
            current_stock = prod.get("stock", 0)
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {prod.get('title')}. Available stock: {current_stock}"
                )
    
    for item in order_data.cartItems:
        prod = await products_collection.find_one({"id": item.packId})
        if prod:
            new_stock = max(0, prod.get("stock", 0) - item.quantity)
            await products_collection.update_one({"id": item.packId}, {"$set": {"stock": new_stock}})

    # Auto-link or auto-create guest user
    email_to_use = current_user_email
    if not email_to_use and order_data.shippingAddress.email:
        email_to_use = order_data.shippingAddress.email.strip().lower()
        
    if email_to_use:
        existing_user = await users_collection.find_one({
            "$or": [
                {"email": email_to_use},
                {"mobile": order_data.shippingAddress.phone}
            ]
        })
        if not existing_user:
            # Create user dynamically
            user_doc = {
                "name": order_data.shippingAddress.fullName,
                "email": email_to_use,
                "mobile": order_data.shippingAddress.phone,
                "password": "",
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(user_doc)

    order_dict = order_data.dict()
    order_dict["created_at"] = datetime.utcnow()
    order_dict["user_email"] = email_to_use
    if order_data.paymentMethod in ["cod", "offline"]:
        order_dict["status"] = "confirmed"
        order_dict["payment_status"] = "COD"
    else:
        order_dict["status"] = "pending_payment"
        order_dict["payment_status"] = "PENDING"
    
    await orders_collection.insert_one(order_dict)
    order_dict["_id"] = str(order_dict["_id"])
    return order_dict

@router.post("/api/admin/orders/offline", status_code=201)
async def log_offline_order(order_data: OfflineSaleCreate, admin: dict = Depends(get_admin_user)):
    prod = await products_collection.find_one({"id": order_data.packId})
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with pack ID '{order_data.packId}' not found"
        )
    
    short_uuid = str(uuid.uuid4()).split("-")[0].upper()
    order_id = f"OFFLINE-{short_uuid}"
    
    shipping_address = {
        "fullName": order_data.customerName,
        "email": order_data.customerEmail or "",
        "phone": order_data.customerPhone,
        "address": "Offline Sale",
        "city": "Offline",
        "pincode": "000000",
        "state": "Offline Store"
    }
    
    cart_item = {
        "packId": order_data.packId,
        "title": prod.get("title", "Botanical Soap"),
        "count": prod.get("count", 1),
        "isSubscription": False,
        "frequency": None,
        "unitPrice": str(prod.get("basePrice", 0)),
        "packPrice": str(prod.get("basePrice", 0)),
        "quantity": order_data.quantity,
        "totalPrice": str(order_data.totalPrice),
        "image": prod.get("image", "")
    }
    
    dt_now = datetime.utcnow()
    if order_data.created_at:
        try:
            dt_now = datetime.fromisoformat(order_data.created_at.replace("Z", "+00:00"))
        except Exception:
            pass
            
    order_doc = {
        "orderId": order_id,
        "shippingAddress": shipping_address,
        "cartItems": [cart_item],
        "subtotal": order_data.totalPrice,
        "discountAmount": 0.0,
        "shippingFee": 0.0,
        "grandTotal": order_data.totalPrice,
        "paymentMethod": order_data.paymentMethod,
        "created_at": dt_now,
        "user_email": order_data.customerEmail or "",
        "isOffline": True,
        "notes": order_data.notes or ""
    }
    
    await orders_collection.insert_one(order_doc)
    order_doc["_id"] = str(order_doc["_id"])
    return order_doc

@router.get("/api/orders")
async def get_orders(current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required to view order history"
        )
    
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
                {"shippingAddress.email": {"$in": emails}},
                {"shippingAddress.phone": {"$in": mobiles}}
            ]
        }
    
    orders = await orders_collection.find(query).to_list(length=None)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@router.get("/api/public/recent-orders")
async def get_recent_public_orders():
    try:
        orders = await orders_collection.find({}).to_list(length=None)
        orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        orders = orders[:15]
        
        recent = []
        for o in orders:
            shipping = o.get("shippingAddress", {})
            full_name = shipping.get("fullName", "A Customer")
            
            name_parts = full_name.strip().split()
            if len(name_parts) >= 2:
                masked_name = f"{name_parts[0]} {name_parts[-1][0]}."
            elif len(name_parts) == 1:
                masked_name = name_parts[0]
            else:
                masked_name = "A Customer"
                
            city = shipping.get("city", "India")
            
            cart_items = o.get("cartItems", [])
            pack_title = "Botanical Soap"
            if cart_items:
                pack_title = cart_items[0].get("title", "Botanical Soap")
            
            recent.append({
                "name": masked_name,
                "city": city,
                "pack": pack_title,
                "created_at": str(o.get("created_at", ""))
            })
        return recent
    except Exception as e:
        return []

@router.post("/api/orders/cashfree-session")
async def create_cashfree_session(order_payload: dict):
    settings = await settings_collection.find_one({"key": "site_settings"})
    if not settings or "cashfree" not in settings:
        raise HTTPException(status_code=400, detail="Cashfree payment gateway is not configured.")
        
    cf_config = settings["cashfree"]
    if not cf_config.get("active"):
        raise HTTPException(status_code=400, detail="Cashfree payment gateway is currently disabled.")
        
    mode = cf_config.get("mode", "test")
    if mode == "live":
        app_id = cf_config.get("app_id_live")
        secret_key = cf_config.get("secret_key_live")
        cf_url = "https://api.cashfree.com/pg/orders"
    else:
        app_id = cf_config.get("app_id_test")
        secret_key = cf_config.get("secret_key_test")
        cf_url = "https://sandbox.cashfree.com/pg/orders"
        
    if not app_id or not secret_key:
        raise HTTPException(status_code=400, detail=f"Cashfree credentials for {mode} mode are missing.")
        
    headers = {
        "x-client-id": app_id,
        "x-client-secret": secret_key,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
    }
    
    order_id = order_payload.get("orderId") or f"HM-{int(datetime.utcnow().timestamp())}"
    customer_name = order_payload.get("customerName") or "Guest Customer"
    customer_phone = order_payload.get("customerPhone") or "9999999999"
    customer_email = order_payload.get("customerEmail") or "guest@hausmade.in"
    if not customer_email or "@" not in customer_email:
        customer_email = "guest@hausmade.in"
        
    customer_phone = "".join(filter(str.isdigit, customer_phone))
    if len(customer_phone) > 10:
        customer_phone = customer_phone[-10:]
    elif len(customer_phone) < 10:
        customer_phone = customer_phone.zfill(10)
        
    cf_payload = {
        "order_id": order_id,
        "order_amount": float(order_payload.get("grandTotal", 0)),
        "order_currency": "INR",
        "customer_details": {
            "customer_id": f"cust_{int(datetime.utcnow().timestamp())}",
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "customer_email": customer_email
        },
        "order_meta": {
            "return_url": order_payload.get("returnUrl") or "http://localhost:5173/?payment=success&order_id={order_id}"
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(cf_url, json=cf_payload, headers=headers, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Cashfree API Error: {resp.text}")
            cf_data = resp.json()
            return {
                "payment_session_id": cf_data.get("payment_session_id"),
                "order_id": order_id,
                "cf_order_id": cf_data.get("cf_order_id"),
                "mode": mode
            }
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Cashfree: {str(e)}")

@router.post("/api/orders/verify-payment")
async def verify_payment(payload: dict):
    order_id = payload.get("orderId")
    if not order_id:
        raise HTTPException(status_code=400, detail="orderId is required")
        
    settings = await settings_collection.find_one({"key": "site_settings"})
    if not settings or "cashfree" not in settings:
        raise HTTPException(status_code=400, detail="Cashfree is not configured")
        
    cf_config = settings["cashfree"]
    mode = cf_config.get("mode", "test")
    if mode == "live":
        app_id = cf_config.get("app_id_live")
        secret_key = cf_config.get("secret_key_live")
        cf_url = f"https://api.cashfree.com/pg/orders/{order_id}"
    else:
        app_id = cf_config.get("app_id_test")
        secret_key = cf_config.get("secret_key_test")
        cf_url = f"https://sandbox.cashfree.com/pg/orders/{order_id}"
        
    headers = {
        "x-client-id": app_id,
        "x-client-secret": secret_key,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(cf_url, headers=headers, timeout=10.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Cashfree verification error: {resp.text}")
            cf_data = resp.json()
            order_status = cf_data.get("order_status")
            
            db_order = await orders_collection.find_one({"orderId": order_id})
            if db_order:
                await orders_collection.update_one(
                    {"orderId": order_id},
                    {"$set": {
                        "payment_status": order_status, 
                        "status": "confirmed" if order_status == "PAID" else "failed"
                    }}
                )
            
            return {
                "order_status": order_status,
                "cf_order_id": cf_data.get("cf_order_id"),
                "order_amount": cf_data.get("order_amount"),
                "payment_status": "success" if order_status == "PAID" else "failed"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

