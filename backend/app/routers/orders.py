from typing import Optional
from datetime import datetime, timedelta, timezone
import re
import uuid
import httpx
import hmac
import hashlib
import base64
import asyncio
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import HTMLResponse, Response
from app.schemas.models import OrderCreate, OfflineSaleCreate, OnlineOrderUpdate, GuestOrderCancelRequest
from app.database.connection import orders_collection, products_collection, users_collection, settings_collection, manual_orders_collection
from app.dependencies.auth_deps import get_current_user_email, get_admin_user
from app.security.email_sender import send_order_confirmation_email

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
    
    if order_data.paymentMethod in ["cod", "offline"]:
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
    pm = str(order_data.paymentMethod or "cod").lower()
    if pm in ["cod", "offline", "cash on delivery", "cash"]:
        order_dict["status"] = "confirmed"
        order_dict["payment_status"] = "COD"
    else:
        order_dict["status"] = "pending_payment"
        order_dict["payment_status"] = "PENDING"
    
    await orders_collection.insert_one(order_dict)
    order_dict["_id"] = str(order_dict["_id"])

    # Trigger order confirmation email if order is confirmed (e.g. COD / offline)
    if order_dict.get("status") == "confirmed":
        asyncio.create_task(send_order_confirmation_email(order_dict))

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
        "address": order_data.address or "Offline Sale",
        "city": order_data.city or "Offline",
        "pincode": order_data.pincode or "000000",
        "state": order_data.state or "Offline Store"
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
            parsed_dt = datetime.fromisoformat(order_data.created_at.replace("Z", "+00:00"))
            if parsed_dt.tzinfo is not None:
                dt_now = parsed_dt.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                dt_now = parsed_dt
        except Exception:
            pass
            
    pm_raw = str(order_data.paymentMethod or "Cash").strip()
    is_cod_sale = pm_raw.lower() in ["cash", "cod", "cash on delivery", "cash_on_delivery"]

    order_doc = {
        "orderId": order_id,
        "shippingAddress": shipping_address,
        "cartItems": [cart_item],
        "subtotal": order_data.totalPrice,
        "discountAmount": 0.0,
        "shippingFee": 0.0,
        "grandTotal": order_data.totalPrice,
        "pricePerSoap": order_data.pricePerSoap,
        "paymentMethod": pm_raw,
        "created_at": dt_now,
        "user_email": order_data.customerEmail or "",
        "isOffline": True,
        "notes": order_data.notes or "",
        "status": "confirmed",
        "payment_status": "COD" if is_cod_sale else "PAID"
    }
    
    await orders_collection.insert_one(order_doc)
    order_doc["_id"] = str(order_doc["_id"])
    return order_doc

@router.put("/api/admin/orders/offline/{order_id}")
async def update_offline_order(order_id: str, order_data: OfflineSaleCreate, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id, "isOffline": True})
    if not order:
        raise HTTPException(status_code=404, detail="Offline order not found")
    if order.get("fulfillment"):
        raise HTTPException(status_code=400, detail="Order already shipped via Delhivery; cancel the shipment before editing")

    prod = await products_collection.find_one({"id": order_data.packId})
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with pack ID '{order_data.packId}' not found"
        )

    shipping_address = {
        "fullName": order_data.customerName,
        "email": order_data.customerEmail or "",
        "phone": order_data.customerPhone,
        "address": order_data.address or "Offline Sale",
        "city": order_data.city or "Offline",
        "pincode": order_data.pincode or "000000",
        "state": order_data.state or "Offline Store"
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

    created_at = order.get("created_at")
    if order_data.created_at:
        try:
            parsed_dt = datetime.fromisoformat(order_data.created_at.replace("Z", "+00:00"))
            if parsed_dt.tzinfo is not None:
                created_at = parsed_dt.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                created_at = parsed_dt
        except Exception:
            pass

    pm_raw = str(order_data.paymentMethod or "Cash").strip()
    is_cod_sale = pm_raw.lower() in ["cash", "cod", "cash on delivery", "cash_on_delivery"]

    updates = {
        "shippingAddress": shipping_address,
        "cartItems": [cart_item],
        "subtotal": order_data.totalPrice,
        "discountAmount": 0.0,
        "shippingFee": 0.0,
        "grandTotal": order_data.totalPrice,
        "pricePerSoap": order_data.pricePerSoap,
        "paymentMethod": pm_raw,
        "created_at": created_at,
        "user_email": order_data.customerEmail or "",
        "notes": order_data.notes or "",
        "payment_status": "COD" if is_cod_sale else "PAID",
        "updated_at": datetime.utcnow()
    }

    await orders_collection.update_one({"_id": order["_id"]}, {"$set": updates})
    updated = await orders_collection.find_one({"_id": order["_id"]})
    updated["_id"] = str(updated["_id"])
    return updated

@router.put("/api/admin/orders/online/{order_id}")
async def update_online_order(order_id: str, order_data: OnlineOrderUpdate, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id, "isOffline": {"$ne": True}})
    if not order:
        raise HTTPException(status_code=404, detail="Online order not found")
    if order.get("fulfillment"):
        raise HTTPException(status_code=400, detail="Order already shipped via Delhivery; cancel the shipment before editing")
    if order.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Cancelled orders cannot be edited")
    if not order_data.cartItems:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    cart_items = []
    for item in order_data.cartItems:
        item_dict = item.dict()
        prod = await products_collection.find_one({"id": item.packId})
        if prod:
            item_dict["title"] = item_dict.get("title") or prod.get("title", "Botanical Soap")
            item_dict["count"] = item_dict.get("count") or prod.get("count", 1)
            item_dict["image"] = item_dict.get("image") or prod.get("image", "")
        cart_items.append(item_dict)

    # Stock was deducted when the order got confirmed/paid, so apply only the quantity difference
    stock_deducted = order.get("status") not in ["pending_payment", "failed", "cancelled"]
    if stock_deducted:
        qty_delta = {}
        for item in order.get("cartItems", []):
            qty_delta[item.get("packId")] = qty_delta.get(item.get("packId"), 0) - int(item.get("quantity", 0) or 0)
        for item in cart_items:
            qty_delta[item["packId"]] = qty_delta.get(item["packId"], 0) + int(item["quantity"] or 0)
        for pack_id, delta in qty_delta.items():
            if not pack_id or delta == 0:
                continue
            prod = await products_collection.find_one({"id": pack_id})
            if not prod:
                continue
            current_stock = prod.get("stock", 0)
            if delta > 0 and current_stock < delta:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for {prod.get('title')}. Available stock: {current_stock}"
                )
        for pack_id, delta in qty_delta.items():
            if not pack_id or delta == 0:
                continue
            prod = await products_collection.find_one({"id": pack_id})
            if prod:
                await products_collection.update_one({"id": pack_id}, {"$set": {"stock": max(0, prod.get("stock", 0) - delta)}})

    created_at = order.get("created_at")
    if order_data.created_at:
        try:
            parsed_dt = datetime.fromisoformat(order_data.created_at.replace("Z", "+00:00"))
            if parsed_dt.tzinfo is not None:
                created_at = parsed_dt.astimezone(timezone.utc).replace(tzinfo=None)
            else:
                created_at = parsed_dt
        except Exception:
            pass

    shipping_address = order_data.shippingAddress.dict()
    updates = {
        "shippingAddress": shipping_address,
        "cartItems": cart_items,
        "subtotal": order_data.subtotal,
        "discountAmount": order_data.discountAmount,
        "shippingFee": order_data.shippingFee,
        "grandTotal": order_data.grandTotal,
        "paymentMethod": order_data.paymentMethod,
        "created_at": created_at,
        "notes": order_data.notes or "",
        "updated_at": datetime.utcnow()
    }
    if shipping_address.get("email"):
        updates["user_email"] = shipping_address["email"].strip().lower()

    await orders_collection.update_one({"_id": order["_id"]}, {"$set": updates})
    updated = await orders_collection.find_one({"_id": order["_id"]})
    updated["_id"] = str(updated["_id"])
    return updated

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
    
    # Exclude pending_payment orders from user view
    query = {"$and": [query, {"status": {"$ne": "pending_payment"}}]}
    
    orders = await orders_collection.find(query).to_list(length=None)
    for order in orders:
        order["_id"] = str(order["_id"])
    return orders

@router.get("/api/public/recent-orders")
async def get_recent_public_orders():
    try:
        orders = await orders_collection.find({"status": {"$ne": "pending_payment"}}).to_list(length=None)
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
                err_text = resp.text
                try:
                    err_json = resp.json()
                    if err_json.get("type") == "authentication_error" or "authentication" in str(err_json).lower():
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Cashfree Authentication Failed ({mode} mode): Invalid App ID or Secret Key. Please update your Cashfree credentials in Admin Panel > Payment Gateway or select COD."
                        )
                    detail_msg = err_json.get("message") or err_text
                    raise HTTPException(status_code=400, detail=f"Cashfree API Error: {detail_msg}")
                except HTTPException as he:
                    raise he
                except Exception:
                    raise HTTPException(status_code=400, detail=f"Cashfree API Error: {err_text}")
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
                new_status = "confirmed" if order_status == "PAID" else "failed"
                await orders_collection.update_one(
                    {"orderId": order_id},
                    {"$set": {
                        "payment_status": order_status, 
                        "status": new_status
                    }}
                )
                
                if order_status == "PAID" and db_order.get("status") == "pending_payment":
                    for item in db_order.get("cartItems", []):
                        prod = await products_collection.find_one({"id": item.get("packId")})
                        if prod:
                            new_stock = max(0, prod.get("stock", 0) - item.get("quantity", 1))
                            await products_collection.update_one({"id": item.get("packId")}, {"$set": {"stock": new_stock}})
                    
                    if db_order.get("isSubscriptionOrder"):
                        from app.database.connection import subscriptions_collection
                        await subscriptions_collection.update_one(
                            {"subscriptionId": db_order.get("subscriptionId")},
                            {"$set": {"status": "active"}}
                        )

                    updated_order = {**db_order, "status": "confirmed", "payment_status": "PAID"}
                    asyncio.create_task(send_order_confirmation_email(updated_order))
            
            return {
                "order_status": order_status,
                "cf_order_id": cf_data.get("cf_order_id"),
                "order_amount": cf_data.get("order_amount"),
                "payment_status": "success" if order_status == "PAID" else "failed"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/orders/razorpay-session")
async def create_razorpay_session(order_payload: dict):
    settings = await settings_collection.find_one({"key": "site_settings"})
    if not settings or "razorpay" not in settings:
        raise HTTPException(status_code=400, detail="Razorpay payment gateway is not configured.")
        
    rzp_config = settings["razorpay"]
    if not rzp_config.get("active"):
        raise HTTPException(status_code=400, detail="Razorpay payment gateway is currently disabled.")
        
    mode = rzp_config.get("mode", "test")
    if mode == "live":
        key_id = rzp_config.get("key_id_live")
        key_secret = rzp_config.get("key_secret_live")
    else:
        key_id = rzp_config.get("key_id_test")
        key_secret = rzp_config.get("key_secret_test")
        
    if not key_id or not key_secret:
        raise HTTPException(status_code=400, detail=f"Razorpay credentials for {mode} mode are missing.")
        
    if key_secret == "***********************" or key_secret == "***" or "placeholder" in key_secret.lower():
        raise HTTPException(
            status_code=400,
            detail="Razorpay Authentication Failed: Default placeholder secret ('***') is currently set. Please enter your valid Razorpay Key Secret in Admin Panel > Payment Gateway or choose COD."
        )
        
    order_id = order_payload.get("orderId") or f"HM-{int(datetime.utcnow().timestamp())}"
    
    auth_str = f"{key_id}:{key_secret}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()
    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/json"
    }
    
    amount_in_paise = int(float(order_payload.get("grandTotal", 0)) * 100)
    
    rzp_payload = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": order_id,
        "notes": {
            "customer_name": order_payload.get("customerName", ""),
            "customer_phone": order_payload.get("customerPhone", ""),
            "customer_email": order_payload.get("customerEmail", "")
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post("https://api.razorpay.com/v1/orders", json=rzp_payload, headers=headers, timeout=10.0)
            if resp.status_code != 200:
                err_text = resp.text
                try:
                    err_json = resp.json()
                    err_desc = ""
                    if isinstance(err_json, dict) and "error" in err_json:
                        err_desc = str(err_json["error"].get("description", ""))
                    if "authentication" in err_desc.lower() or "authentication" in err_text.lower() or "bad_request_error" in err_text.lower():
                        raise HTTPException(
                            status_code=400,
                            detail=f"Razorpay Authentication Failed ({mode} mode): Invalid Key ID or Key Secret. Please enter your valid Razorpay API credentials in Admin Panel > Payment Gateway or select Cash on Delivery."
                        )
                    detail_msg = err_desc or err_text
                    raise HTTPException(status_code=400, detail=f"Razorpay API Error: {detail_msg}")
                except HTTPException as he:
                    raise he
                except Exception:
                    raise HTTPException(status_code=400, detail=f"Razorpay API Error: {err_text}")
                
            rzp_data = resp.json()
            return {
                "razorpay_order_id": rzp_data.get("id"),
                "order_id": order_id,
                "amount": rzp_data.get("amount"),
                "currency": rzp_data.get("currency"),
                "key_id": key_id
            }
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Razorpay: {str(e)}")

@router.post("/api/orders/verify-razorpay")
async def verify_razorpay_payment(payload: dict):
    order_id = payload.get("orderId")
    razorpay_order_id = payload.get("razorpay_order_id")
    razorpay_payment_id = payload.get("razorpay_payment_id")
    razorpay_signature = payload.get("razorpay_signature")
    
    if not all([order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        raise HTTPException(status_code=400, detail="Missing Razorpay verification parameters")
        
    settings = await settings_collection.find_one({"key": "site_settings"})
    rzp_config = settings.get("razorpay", {})
    mode = rzp_config.get("mode", "test")
    if mode == "live":
        key_secret = rzp_config.get("key_secret_live", "")
    else:
        key_secret = rzp_config.get("key_secret_test", "")
        
    # Verify signature
    msg = f"{razorpay_order_id}|{razorpay_payment_id}"
    generated_signature = hmac.new(key_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
    
    is_valid = hmac.compare_digest(generated_signature, razorpay_signature)
    
    db_order = await orders_collection.find_one({"orderId": order_id})
    if db_order:
        new_status = "confirmed" if is_valid else "failed"
        payment_status = "PAID" if is_valid else "FAILED"
        
        await orders_collection.update_one(
            {"orderId": order_id},
            {"$set": {
                "payment_status": payment_status, 
                "status": new_status,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_order_id": razorpay_order_id
            }}
        )
        
        if is_valid and db_order.get("status") == "pending_payment":
            # Deduct stock on successful payment
            for item in db_order.get("cartItems", []):
                prod = await products_collection.find_one({"id": item.get("packId")})
                if prod:
                    new_stock = max(0, prod.get("stock", 0) - item.get("quantity", 1))
                    await products_collection.update_one({"id": item.get("packId")}, {"$set": {"stock": new_stock}})
            
            if db_order.get("isSubscriptionOrder"):
                from app.database.connection import subscriptions_collection
                await subscriptions_collection.update_one(
                    {"subscriptionId": db_order.get("subscriptionId")},
                    {"$set": {"status": "active"}}
                )

            updated_order = {**db_order, "status": "confirmed", "payment_status": "PAID"}
            asyncio.create_task(send_order_confirmation_email(updated_order))
        
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")
        
    return {
        "payment_status": "success",
        "order_id": order_id
    }

# Helper to get settings
async def get_delhivery_config_internal():
    settings = await settings_collection.find_one({"key": "site_settings"})
    if not settings or "delhivery" not in settings:
        return None
    return settings["delhivery"]

@router.get("/api/admin/orders/{order_id}/delhivery/serviceability")
async def check_delhivery_serviceability(order_id: str, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
    pincode = order.get("shippingAddress", {}).get("pincode")
    if not pincode:
        raise HTTPException(status_code=400, detail="Pincode is missing in shipping address")
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        return {
            "status": "mock",
            "serviceable": True,
            "pincode": pincode,
            "cod_available": True,
            "prepaid_available": True,
            "provider": "Delhivery (Demo Mode)",
            "estimated_days": 3,
            "cost_estimate": 45.0
        }
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    url = f"{base_url}/c/api/pin-codes/json/?token={token}&filter_codes={pincode}"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                codes = data.get("delivery_codes", [])
                if codes and isinstance(codes, list):
                    code_info = codes[0].get("postal_code", {})
                    is_serviceable = bool(code_info.get("pin"))
                    cod = str(code_info.get("cod", "")).upper() == "Y"
                    prepaid = str(code_info.get("pre_paid", code_info.get("prepaid", ""))).upper() == "Y"
                    return {
                        "status": "success",
                        "serviceable": is_serviceable,
                        "pincode": pincode,
                        "cod_available": cod,
                        "prepaid_available": prepaid,
                        "provider": "Delhivery",
                        "estimated_days": 3,
                        "cost_estimate": 45.0
                    }
                else:
                    return {
                        "status": "success",
                        "serviceable": False,
                        "pincode": pincode,
                        "cod_available": False,
                        "prepaid_available": False,
                        "provider": "Delhivery"
                    }
            else:
                return {
                    "status": "error_fallback",
                    "detail": f"Delhivery API returned status code {resp.status_code}",
                    "serviceable": True,
                    "pincode": pincode,
                    "cod_available": True,
                    "prepaid_available": True,
                    "provider": "Delhivery (Staging Fallback)"
                }
        except Exception as e:
            return {
                "status": "error_fallback",
                "detail": str(e),
                "serviceable": True,
                "pincode": pincode,
                "cod_available": True,
                "prepaid_available": True,
                "provider": "Delhivery (Error Fallback)"
            }

async def process_delhivery_shipment_booking(order_or_id, weight=500, length=15, width=15, height=10, payment_mode=None, cod_amount=None):
    import json
    if isinstance(order_or_id, str):
        order = await orders_collection.find_one({"orderId": order_or_id})
        if not order:
            order = await orders_collection.find_one({"_id": order_or_id})
    else:
        order = order_or_id
        
    if not order:
        return None
        
    # Check if already fulfilled
    if order.get("fulfillment", {}).get("awb"):
        return order.get("fulfillment")
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        raise ValueError("Delhivery API token is not configured in Site Settings.")
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    # 1. Fetch authentic Delhivery Waybill AWB for seller account
    real_awb = None
    async with httpx.AsyncClient() as client:
        try:
            wb_url = f"{base_url}/waybill/api/fetch/json/?token={token}&count=1"
            wb_resp = await client.get(wb_url, headers={"Authorization": f"Token {token}"}, timeout=10.0)
            if wb_resp.status_code == 200:
                raw_wb = wb_resp.text.strip().strip('"').strip("'")
                if raw_wb and raw_wb.replace(".", "").isdigit():
                    real_awb = raw_wb
        except Exception as wb_err:
            print(f"Delhivery waybill fetch error: {wb_err}")

    # Never send a made-up waybill: Delhivery rejects unknown AWBs. Leave it blank so Delhivery assigns one.
    waybill = real_awb or ""

    # Delhivery's parser crashes ("suspicious order/consignee") on characters like & # % ; \ " and on newlines
    def clean_text(value, fallback=""):
        text = str(value or "").replace("&", " and ")
        text = re.sub(r'[#%;\\"\'<>|`~^*{}\[\]]', " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text or fallback

    # Determine payment mode (COD vs Prepaid)
    if payment_mode:
        pmode = "COD" if str(payment_mode).strip().upper() in ["COD", "CASH"] else "Prepaid"
    else:
        pm = str(order.get("paymentMethod") or "").strip().lower()
        pstatus = str(order.get("payment_status") or "").strip().upper()
        if pm in ["cod", "cash", "cash on delivery", "cash_on_delivery", "offline"] or pstatus == "COD":
            pmode = "COD"
        else:
            pmode = "Prepaid"

    if cod_amount is not None:
        cod_amt = float(cod_amount) if pmode == "COD" else 0.0
    else:
        cod_amt = float(order.get("grandTotal", 0.0)) if pmode == "COD" else 0.0
    
    warehouse_name = config.get("warehouse_name") or "Yogi Arcade"

    # Sanitize phone number (remove +91, leading 0, spaces)
    raw_phone = order.get("shippingAddress", {}).get("phone", "")
    clean_phone = ''.join(filter(str.isdigit, raw_phone))
    if clean_phone.startswith("91") and len(clean_phone) > 10:
        clean_phone = clean_phone[2:]
    if clean_phone.startswith("0") and len(clean_phone) > 10:
        clean_phone = clean_phone[1:]
    
    # Ensure address is at least 12 chars for Delhivery
    raw_address = clean_text(order.get("shippingAddress", {}).get("address", ""))
    if len(raw_address) < 12:
        raw_address = raw_address + " - " + clean_text(order.get("shippingAddress", {}).get("city", ""))

    shipment_data = {
        "shipments": [
            {
                "waybill": waybill,
                "name": clean_text(order.get("shippingAddress", {}).get("fullName"), "Customer"),
                "add": raw_address,
                "pin": ''.join(filter(str.isdigit, str(order.get("shippingAddress", {}).get("pincode", "395010")))),
                "city": clean_text(order.get("shippingAddress", {}).get("city"), "Surat"),
                "state": clean_text(order.get("shippingAddress", {}).get("state"), "Gujarat"),
                "country": "India",
                "phone": clean_phone,
                "payment_mode": pmode,
                "cod_amount": cod_amt,
                "order": order.get("orderId"),
                "products_desc": "Botanical Cleanse Bars",
                "quantity": str(sum(item.get("quantity", 1) for item in order.get("cartItems", []))),
                "weight": str(weight),
                "shipment_length": str(length),
                "shipment_width": str(width),
                "shipment_height": str(height),
                "total_amount": float(order.get("grandTotal", 0.0)),
                "return_add": config.get("pickup_address") or "222 Yogi Arcade",
                "return_pin": config.get("pickup_pincode") or "395010",
                "return_city": config.get("pickup_city") or "Surat",
                "return_state": config.get("pickup_state") or "Gujarat",
                "return_country": "India",
                "return_name": warehouse_name,
                "return_phone": config.get("pickup_phone") or "7600081431",
                "seller_gst_tin": (config.get("gst_number") or "").strip().upper(),
            }
        ],
        "pickup_location": {
            "name": warehouse_name,
            "add": config.get("pickup_address") or "222 Yogi Arcade",
            "pin": config.get("pickup_pincode") or "395010",
            "phone": config.get("pickup_phone") or "7600081431",
            "city": config.get("pickup_city") or "Surat",
            "state": config.get("pickup_state") or "Gujarat"
        }
    }
    
    url = f"{base_url}/api/cmu/create.json"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    body_data = {
        "format": "json",
        "data": json.dumps(shipment_data)
    }
    
    delhivery_api_notice = ""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, data=body_data, headers=headers, timeout=15.0)
            if resp.status_code != 200:
                raise ValueError(f"Delhivery API responded with status {resp.status_code}: {resp.text}")
                
            resp_json = resp.json()
            
            if resp_json.get("success") is False:
                packages = resp_json.get("packages", [])
                if packages and isinstance(packages, list):
                    pkg = packages[0]
                    if pkg.get("status") == "Fail":
                        remarks = pkg.get("remarks", ["Unknown error"])
                        raise ValueError(f"Delhivery API rejected shipment: {', '.join(remarks)}")
                error_msg = resp_json.get("error", "Unknown Delhivery Error")
                raise ValueError(f"Delhivery API Error: {error_msg}")

            packages = resp_json.get("packages", [])
            if packages and isinstance(packages, list):
                pkg = packages[0]
                if pkg.get("status") == "Fail":
                    remarks = pkg.get("remarks", ["Unknown error"])
                    raise ValueError(f"Delhivery API rejected shipment: {', '.join(remarks)}")
                if pkg.get("waybill"):
                    waybill = pkg.get("waybill")
                    
            create_resp = resp_json.get("createOrderResponse", {})
            if isinstance(create_resp, dict) and create_resp.get("errorCode"):
                err_msg = create_resp.get("errorMessage") or f"Error {create_resp.get('errorCode')}"
                raise ValueError(f"Delhivery API Error: {err_msg}")
        except Exception as e:
            raise ValueError(f"Delhivery shipment booking failed: {str(e)}")

    if not waybill:
        raise ValueError("Delhivery shipment booking failed: Delhivery did not return a waybill number")

    fulfillment = {
        "awb": waybill,
        "provider": "Delhivery Express",
        "payment_mode": pmode,
        "cod_amount": cod_amt,
        "weight": weight,
        "dimensions": f"{length}x{width}x{height} cm",
        "shipped_at": datetime.utcnow().isoformat(),
        "status": "Manifested",
        "pickup_scheduled": False,
        "label_url": f"/api/orders/label/{waybill}",
        "api_notice": delhivery_api_notice
    }
    
    from bson import ObjectId
    filter_id = order["_id"]
    if isinstance(filter_id, str):
        try:
            filter_id = ObjectId(filter_id)
        except Exception:
            pass

    await orders_collection.update_one(
        {"_id": filter_id},
        {"$set": {"fulfillment": fulfillment, "status": "shipped"}}
    )
    return fulfillment

@router.post("/api/admin/orders/{order_id}/delhivery/ship")
async def create_delhivery_shipment(order_id: str, payload: dict, admin: dict = Depends(get_admin_user)):
    weight = payload.get("weight", 500)
    length = payload.get("length", 15)
    width = payload.get("width", 15)
    height = payload.get("height", 10)
    payment_mode = payload.get("payment_mode")
    cod_amount = payload.get("cod_amount")
    
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
    try:
        fulfillment = await process_delhivery_shipment_booking(
            order, weight=weight, length=length, width=width, height=height,
            payment_mode=payment_mode, cod_amount=cod_amount
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    msg = f"Consignment successfully booked! AWB: {fulfillment.get('awb')}"
    if fulfillment.get("api_notice"):
        msg += f" ({fulfillment.get('api_notice')})"
        
    return {
        "status": "success",
        "detail": msg,
        "fulfillment": fulfillment
    }

@router.post("/api/admin/orders/{order_id}/delhivery/pickup")
async def schedule_delhivery_pickup(order_id: str, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
    fulfillment = order.get("fulfillment", {})
    if not fulfillment.get("awb"):
        # Auto-create fulfillment if missing
        fulfillment = await process_delhivery_shipment_booking(order)
        if not fulfillment or not fulfillment.get("awb"):
            raise HTTPException(status_code=400, detail="Order has no associated shipment or AWB")
        
    config = await get_delhivery_config_internal()
    
    if not config or not config.get("active") or not config.get("api_token"):
        # Mock mode success
        await orders_collection.update_one(
            {"_id": order["_id"]},
            {"$set": {
                "fulfillment.pickup_scheduled": True, 
                "fulfillment.status": "Pickup Scheduled",
                "status": "shipped"
            }}
        )
        return {"status": "success", "message": "Pickup scheduled (Mock mode)"}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    pickup_location_name = config.get("warehouse_name") or "Yogi Arcade"
    
    # Calculate appropriate pickup date and time in IST (UTC+5:30)
    from datetime import timezone
    ist = timezone(timedelta(hours=5, minutes=30))
    now_ist = datetime.now(ist)
    
    # Always set pickup_date to TODAY so Delhivery moves the order to "Ready for Pickup" immediately
    pickup_date_str = now_ist.strftime("%Y-%m-%d")
    pickup_time_str = (now_ist + timedelta(minutes=15)).strftime("%H:%M:%S")
    
    pickup_payload = {
        "pickup_location": pickup_location_name,
        "pickup_date": pickup_date_str,
        "pickup_time": pickup_time_str,
        "expected_package_count": 1
    }
    
    url = f"{base_url}/fm/request/new/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    delhivery_error = ""
    is_success = False
    pr_id = None
    
    print(f"[DELHIVERY PICKUP REQUEST] URL: {url} | Payload: {pickup_payload}")
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=pickup_payload, headers=headers, timeout=15.0)
            print(f"[DELHIVERY PICKUP RESPONSE] Status: {resp.status_code} | Text: {resp.text}")
            
            try:
                resp_json = resp.json()
            except Exception:
                resp_json = {}
                
            if resp.status_code in [200, 201]:
                if isinstance(resp_json, dict):
                    pr_id = resp_json.get("pr_id") or resp_json.get("pickup_id") or resp_json.get("id")
                    
                    if resp_json.get("pickup_location") and isinstance(resp_json["pickup_location"], list):
                        delhivery_error = f"Pickup location error: {', '.join(resp_json['pickup_location'])}"
                    elif resp_json.get("error"):
                        delhivery_error = str(resp_json["error"])
                    elif resp_json.get("detail"):
                        delhivery_error = str(resp_json["detail"])
                    elif resp_json.get("prepaid") is False and resp_json.get("message"):
                        delhivery_error = str(resp_json["message"])
                    elif pr_id is not None or resp_json.get("status") in ["Success", "success", "OK", "ok", True] or resp_json.get("success") is True or resp_json.get("pr_exist") is True:
                        is_success = True
                    else:
                        remarks = resp_json.get("remark") or resp_json.get("remarks") or resp_json.get("data")
                        if remarks:
                            delhivery_error = str(remarks)
                        else:
                            delhivery_error = f"Delhivery response missing pickup ID: {resp.text}"
                else:
                    is_success = True
            else:
                if isinstance(resp_json, dict):
                    err_detail = resp_json.get("pickup_location") or resp_json.get("error") or resp_json.get("detail") or resp_json.get("message")
                    if isinstance(err_detail, list):
                        delhivery_error = ", ".join(map(str, err_detail))
                    elif err_detail:
                        delhivery_error = str(err_detail)
                    else:
                        delhivery_error = resp.text
                else:
                    delhivery_error = resp.text
        except Exception as e:
            delhivery_error = f"Connection exception: {str(e)}"

    # If Delhivery says a pickup request already exists/is scheduled for this location today, treat as success!
    lower_err = delhivery_error.lower()
    if not is_success and any(k in lower_err for k in ["already", "exist", "duplicate", "active", "present", "scheduled"]):
        print(f"[DELHIVERY PICKUP NOTICE] Active pickup already exists for this location: {delhivery_error}")
        is_success = True
        delhivery_error = ""

    if not is_success:
        raise HTTPException(status_code=400, detail=f"Delhivery rejected pickup: {delhivery_error}")

    # Delhivery succeeded! Update DB
    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": {
            "fulfillment.pickup_scheduled": True, 
            "fulfillment.pickup_id": pr_id,
            "fulfillment.pickup_date": pickup_date_str,
            "fulfillment.pickup_time": pickup_time_str,
            "fulfillment.status": "Pickup Scheduled",
            "status": "shipped"
        }}
    )

    msg = f"Pickup scheduled successfully with Delhivery! (Pickup Date: {pickup_date_str} {pickup_time_str})"
    msg = f"Pickup scheduled successfully with Delhivery! (Pickup Date: {pickup_date_str} {pickup_time_str})"
    if pr_id:
        msg += f" [PR ID: {pr_id}]"

    return {"status": "success", "message": msg}

@router.post("/api/admin/orders/delhivery/bulk-ship")
async def bulk_create_delhivery_shipment(payload: dict, admin: dict = Depends(get_admin_user)):
    order_ids = payload.get("order_ids", [])
    weight = payload.get("weight", 500)
    length = payload.get("length", 15)
    width = payload.get("width", 15)
    height = payload.get("height", 10)
    
    if not order_ids or not isinstance(order_ids, list):
        raise HTTPException(status_code=400, detail="No order IDs provided")
        
    successes = []
    failures = []
    
    for oid in order_ids:
        order = await orders_collection.find_one({"orderId": oid})
        if not order:
            order = await orders_collection.find_one({"_id": oid})
            if not order:
                try:
                    from bson import ObjectId
                    order = await orders_collection.find_one({"_id": ObjectId(oid)})
                except Exception:
                    pass
        if not order:
            failures.append({"order_id": oid, "reason": "Order not found"})
            continue
            
        if order.get("status") == "cancelled" or order.get("fulfillment", {}).get("status", "").lower() == "cancelled":
            failures.append({"order_id": oid, "reason": "Order is cancelled"})
            continue
            
        if order.get("fulfillment") and order.get("fulfillment", {}).get("awb"):
            failures.append({"order_id": oid, "reason": "Order already shipped"})
            continue
            
        try:
            fulfillment = await process_delhivery_shipment_booking(
                order, weight=weight, length=length, width=width, height=height
            )
            successes.append({"order_id": oid, "awb": fulfillment.get("awb")})
        except Exception as e:
            failures.append({"order_id": oid, "reason": str(e)})
            
    return {
        "status": "success",
        "processed_count": len(successes),
        "failed_count": len(failures),
        "successes": successes,
        "failures": failures,
        "detail": f"Successfully shipped {len(successes)} order(s)." + (f" ({len(failures)} skipped/failed)" if failures else "")
    }

@router.post("/api/admin/orders/delhivery/bulk-pickup")
async def bulk_schedule_delhivery_pickup(payload: dict, admin: dict = Depends(get_admin_user)):
    order_ids = payload.get("order_ids", [])
    if not order_ids or not isinstance(order_ids, list):
        raise HTTPException(status_code=400, detail="No order IDs provided")
        
    successes = []
    failures = []
    
    for oid in order_ids:
        order = await orders_collection.find_one({"orderId": oid})
        if not order:
            order = await orders_collection.find_one({"_id": oid})
            if not order:
                try:
                    from bson import ObjectId
                    order = await orders_collection.find_one({"_id": ObjectId(oid)})
                except Exception:
                    pass
        if not order:
            failures.append({"order_id": oid, "reason": "Order not found"})
            continue
            
        if order.get("status") == "cancelled" or order.get("fulfillment", {}).get("status", "").lower() == "cancelled":
            failures.append({"order_id": oid, "reason": "Order is cancelled"})
            continue
            
        try:
            fulfillment = order.get("fulfillment", {})
            if not fulfillment.get("awb"):
                fulfillment = await process_delhivery_shipment_booking(order)
                if not fulfillment or not fulfillment.get("awb"):
                    failures.append({"order_id": oid, "reason": "Shipment booking failed"})
                    continue
                    
            config = await get_delhivery_config_internal()
            if not config or not config.get("active") or not config.get("api_token"):
                await orders_collection.update_one(
                    {"_id": order["_id"]},
                    {"$set": {
                        "fulfillment.pickup_scheduled": True, 
                        "fulfillment.status": "Pickup Scheduled",
                        "status": "shipped"
                    }}
                )
                successes.append({"order_id": oid, "mode": "mock"})
                continue
                
            token = config["api_token"]
            mode = config.get("mode", "test")
            base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
            pickup_location_name = config.get("warehouse_name") or "Yogi Arcade"
            
            from datetime import timezone
            ist = timezone(timedelta(hours=5, minutes=30))
            now_ist = datetime.now(ist)
            pickup_date_str = now_ist.strftime("%Y-%m-%d")
            pickup_time_str = (now_ist + timedelta(minutes=15)).strftime("%H:%M:%S")
            
            pickup_payload = {
                "pickup_location": pickup_location_name,
                "pickup_date": pickup_date_str,
                "pickup_time": pickup_time_str,
                "expected_package_count": 1
            }
            url = f"{base_url}/fm/request/new/"
            headers = {
                "Authorization": f"Token {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            delhivery_error = ""
            is_success = False
            pr_id = None
            
            async with httpx.AsyncClient() as client:
                try:
                    resp = await client.post(url, json=pickup_payload, headers=headers, timeout=15.0)
                    try:
                        resp_json = resp.json()
                    except Exception:
                        resp_json = {}
                        
                    if resp.status_code in [200, 201]:
                        if isinstance(resp_json, dict):
                            pr_id = resp_json.get("pr_id") or resp_json.get("pickup_id") or resp_json.get("id")
                            if resp_json.get("pickup_location") and isinstance(resp_json["pickup_location"], list):
                                delhivery_error = f"Pickup location error: {', '.join(resp_json['pickup_location'])}"
                            elif resp_json.get("error"):
                                delhivery_error = str(resp_json["error"])
                            elif resp_json.get("detail"):
                                delhivery_error = str(resp_json["detail"])
                            elif resp_json.get("prepaid") is False and resp_json.get("message"):
                                delhivery_error = str(resp_json["message"])
                            elif pr_id is not None or resp_json.get("status") in ["Success", "success", "OK", "ok", True] or resp_json.get("success") is True or resp_json.get("pr_exist") is True:
                                is_success = True
                            else:
                                remarks = resp_json.get("remark") or resp_json.get("remarks") or resp_json.get("data")
                                delhivery_error = str(remarks) if remarks else f"Missing pickup ID: {resp.text}"
                        else:
                            is_success = True
                    else:
                        if isinstance(resp_json, dict):
                            err_detail = resp_json.get("pickup_location") or resp_json.get("error") or resp_json.get("detail") or resp_json.get("message")
                            delhivery_error = ", ".join(map(str, err_detail)) if isinstance(err_detail, list) else str(err_detail or resp.text)
                        else:
                            delhivery_error = resp.text
                except Exception as e:
                    delhivery_error = f"Connection exception: {str(e)}"
                    
            lower_err = delhivery_error.lower()
            if not is_success and any(k in lower_err for k in ["already", "exist", "duplicate", "active", "present", "scheduled"]):
                is_success = True
                delhivery_error = ""
                
            if not is_success:
                failures.append({"order_id": oid, "reason": delhivery_error})
            else:
                await orders_collection.update_one(
                    {"_id": order["_id"]},
                    {"$set": {
                        "fulfillment.pickup_scheduled": True, 
                        "fulfillment.pickup_id": pr_id,
                        "fulfillment.pickup_date": pickup_date_str,
                        "fulfillment.pickup_time": pickup_time_str,
                        "fulfillment.status": "Pickup Scheduled",
                        "status": "shipped"
                    }}
                )
                successes.append({"order_id": oid, "pr_id": pr_id})
        except Exception as e:
            failures.append({"order_id": oid, "reason": str(e)})

    return {
        "status": "success",
        "processed_count": len(successes),
        "failed_count": len(failures),
        "successes": successes,
        "failures": failures,
        "detail": f"Successfully scheduled pickup for {len(successes)} order(s)." + (f" ({len(failures)} skipped/failed)" if failures else "")
    }

@router.delete("/api/admin/orders/{order_id}")
async def delete_admin_order(order_id: str, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"$or": [{"orderId": order_id}, {"_id": order_id}]})
    if not order:
        try:
            from bson import ObjectId
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        except Exception:
            pass
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    await orders_collection.delete_one({"_id": order["_id"]})
    return {"status": "success", "message": f"Order {order.get('orderId', order_id)} deleted successfully"}

@router.post("/api/admin/orders/{order_id}/delhivery/cancel")
async def cancel_delhivery_shipment(order_id: str, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

    fulfillment = order.get("fulfillment", {})
    awb = fulfillment.get("awb")
    if not awb:
        raise HTTPException(status_code=400, detail="Order has no associated AWB")
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token") or not awb:
        await orders_collection.update_one(
            {"_id": order["_id"]},
            {"$unset": {"fulfillment": ""}, "$set": {"status": "confirmed"}}
        )
        return {"status": "success", "detail": "Shipment cancelled"}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    cancel_payload = {
        "waybill": awb,
        "cancellation": "true"
    }
    
    url = f"{base_url}/api/p/edit"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=cancel_payload, headers=headers, timeout=10.0)
            await orders_collection.update_one(
                {"_id": order["_id"]},
                {"$unset": {"fulfillment": ""}, "$set": {"status": "confirmed"}}
            )
            return {"status": "success", "detail": "Shipment cancelled successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/admin/delhivery/label/{awb}")
async def fetch_delhivery_label(awb: str, admin: dict = Depends(get_admin_user)):
    config = await get_delhivery_config_internal()
    if not config or not config.get("api_token"):
        raise HTTPException(status_code=400, detail="Delhivery is not configured")
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    url = f"{base_url}/api/p/packing_slip?wbns={awb}&pdf=true"
    headers = {
        "Authorization": f"Token {token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=15.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Delhivery API Error: {resp.text}")
                
            data = resp.json()
            packages = data.get("packages", [])
            if not packages:
                raise HTTPException(status_code=404, detail="No label found for this AWB")
                
            package = packages[0]
            pdf_link = package.get("pdf_download_link")
            html_content = package.get("packing_slip")
            
            if pdf_link:
                return {"url": pdf_link}
            elif html_content:
                return {"html": html_content}
            else:
                raise HTTPException(status_code=404, detail="Label content unavailable")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=str(e))

_last_delhivery_sync_time = 0.0
_delhivery_sync_lock = asyncio.Lock()

async def sync_delhivery_orders_live_status(limit: int = 200, force: bool = False):
    global _last_delhivery_sync_time
    import time

    now = time.time()
    # If not explicitly forced, enforce a 120-second cooldown between Delhivery scans
    if not force and (now - _last_delhivery_sync_time < 120):
        return 0

    # Avoid duplicate concurrent sync tasks
    if _delhivery_sync_lock.locked():
        return 0

    async with _delhivery_sync_lock:
        updated_count = 0
        try:
            config = await get_delhivery_config_internal()
            if not config or not config.get("active") or not config.get("api_token"):
                return 0
            token = config["api_token"]

            active_orders = await orders_collection.find({
                "fulfillment.awb": {"$exists": True, "$ne": None},
                "fulfillment.status": {"$nin": ["Delivered", "Cancelled", "RTO Delivered", "Returned to Origin"]}
            }).to_list(length=limit)

            if not active_orders:
                _last_delhivery_sync_time = time.time()
                return 0

            semaphore = asyncio.Semaphore(10)  # Query up to 10 AWBs concurrently

            async with httpx.AsyncClient(timeout=6.0) as client:
                async def sync_single_order(order):
                    awb = order.get("fulfillment", {}).get("awb")
                    if not awb or awb.startswith("DELHIVERY"):
                        return 0
                    url = f"https://track.delhivery.com/api/v2/packages/json/?token={token}&waybill={awb}"
                    async with semaphore:
                        try:
                            resp = await client.get(url)
                            if resp.status_code == 200:
                                data = resp.json()
                                shipment_list = data.get("ShipmentData", [])
                                if shipment_list and isinstance(shipment_list, list):
                                    st = shipment_list[0].get("Shipment", {}).get("Status", {})
                                    status_name = st.get("Status")
                                    status_type = str(st.get("StatusType") or "").upper()
                                    if status_name:
                                        base_fields = {"fulfillment.status_type": status_type}
                                        if st.get("StatusDateTime"):
                                            base_fields["fulfillment.status_updated_at"] = st.get("StatusDateTime")
                                        # Delhivery reports returns via StatusType: "RT" = on its way back,
                                        # Status "RTO" + StatusType "DL" = received back at origin
                                        if status_name.upper() == "RTO" and status_type == "DL":
                                            await orders_collection.update_one(
                                                {"_id": order["_id"]},
                                                {"$set": {**base_fields, "fulfillment.status": "Returned to Origin"}}
                                            )
                                            return 1
                                        if status_type == "RT" or status_name.upper() == "RTO":
                                            await orders_collection.update_one(
                                                {"_id": order["_id"]},
                                                {"$set": {**base_fields, "fulfillment.status": "RTO - In transit", "status": "shipped", "fulfillment.pickup_scheduled": True}}
                                            )
                                            return 1
                                        clean_status_name = status_name.lower()
                                        update_fields = {**base_fields, "fulfillment.status": status_name}
                                        if any(term in clean_status_name for term in ["pickup scheduled", "pickup_scheduled", "pickup requested", "pickup created", "ready for pickup"]):
                                            update_fields["fulfillment.pickup_scheduled"] = True
                                        if any(st_term in clean_status_name for st_term in ["shipped", "dispatched", "in transit", "out for delivery", "in-transit"]):
                                            update_fields["status"] = "shipped"
                                            update_fields["fulfillment.pickup_scheduled"] = True
                                        elif "delivered" in clean_status_name:
                                            update_fields["status"] = "delivered"
                                            update_fields["fulfillment.pickup_scheduled"] = True
                                        await orders_collection.update_one(
                                            {"_id": order["_id"]},
                                            {"$set": update_fields}
                                        )
                                        return 1
                        except Exception as ex:
                            print(f"Error syncing AWB {awb}: {ex}")
                    return 0

                results = await asyncio.gather(*(sync_single_order(o) for o in active_orders), return_exceptions=True)
                for res in results:
                    if isinstance(res, int):
                        updated_count += res

            _last_delhivery_sync_time = time.time()
        except Exception as e:
            print(f"Live status sync error: {e}")
        return updated_count

@router.post("/api/admin/orders/delhivery/sync-status")
async def admin_sync_delhivery_status(admin: dict = Depends(get_admin_user)):
    count = await sync_delhivery_orders_live_status(limit=200, force=True)
    return {"status": "success", "message": "Successfully synced status from Delhivery", "updated_count": count}

INDIAN_STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
    "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
    "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
]
STATE_ALIASES = {
    "gj": "Gujarat", "mh": "Maharashtra", "rj": "Rajasthan", "dl": "Delhi", "new delhi": "Delhi",
    "nct of delhi": "Delhi", "ka": "Karnataka", "tn": "Tamil Nadu", "up": "Uttar Pradesh", "mp": "Madhya Pradesh",
    "orissa": "Odisha", "pondicherry": "Puducherry", "uttaranchal": "Uttarakhand", "hr": "Haryana", "wb": "West Bengal",
    "j&k": "Jammu and Kashmir", "jammu & kashmir": "Jammu and Kashmir", "telengana": "Telangana"
}


def _normalize_state(raw):
    """Map spelling variants (e.g. 'Gujrat', 'GJ') to the official state name; unknown values are kept as-is."""
    import difflib
    text = " ".join(str(raw or "").replace("&", " and ").split()).strip()
    if not text:
        return ""
    key = text.lower()
    if str(raw).strip().lower() in STATE_ALIASES:
        return STATE_ALIASES[str(raw).strip().lower()]
    if key in STATE_ALIASES:
        return STATE_ALIASES[key]
    lookup = {st.lower(): st for st in INDIAN_STATES}
    if key in lookup:
        return lookup[key]
    match = difflib.get_close_matches(key, list(lookup.keys()), n=1, cutoff=0.8)
    return lookup[match[0]] if match else text


GST_RATE = 5.0  # fixed GST rate (%) for the GST report; prices include GST


def _is_excluded_from_gst(order):
    if str(order.get("status") or "").lower() == "cancelled":
        return True
    f_status = str((order.get("fulfillment") or {}).get("status") or "").lower()
    return f_status == "cancelled" or "rto" in f_status or "return" in f_status

@router.get("/api/admin/reports/gst")
async def get_gst_report(from_date: Optional[str] = None, to_date: Optional[str] = None, admin: dict = Depends(get_admin_user)):
    config = await get_delhivery_config_internal()
    if not config or not config.get("api_token"):
        raise HTTPException(status_code=400, detail="Delhivery API token is not configured in Site Settings.")

    gst_rate = GST_RATE
    seller_state = _normalize_state(config.get("pickup_state") or "Gujarat")
    ist = timedelta(hours=5, minutes=30)

    def order_date_ist(order):
        dt = order.get("created_at")
        if isinstance(dt, str):
            try:
                dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            except ValueError:
                return None
        if not isinstance(dt, datetime):
            return None
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt + ist

    orders = await orders_collection.find({"fulfillment.awb": {"$exists": True, "$ne": ""}}).to_list(length=None)
    selected = []
    for o in orders:
        awb = str(o.get("fulfillment", {}).get("awb") or "")
        if not awb or awb.startswith("DELHIVERY") or _is_excluded_from_gst(o):
            continue
        local_dt = order_date_ist(o)
        day = local_dt.strftime("%Y-%m-%d") if local_dt else ""
        if from_date and (not day or day < from_date):
            continue
        if to_date and (not day or day > to_date):
            continue
        selected.append((o, awb, local_dt))

    # Fetch shipment details from Delhivery in batches of 50 AWBs
    token = config.get("api_token")
    base_url = "https://staging-express.delhivery.com" if config.get("mode") == "test" else "https://track.delhivery.com"
    shipments = {}
    awbs = [awb for _, awb, _ in selected]
    async with httpx.AsyncClient(timeout=20.0) as client:
        for i in range(0, len(awbs), 50):
            batch = awbs[i:i + 50]
            try:
                resp = await client.get(f"{base_url}/api/v2/packages/json/", params={"token": token, "waybill": ",".join(batch)})
                if resp.status_code != 200:
                    print(f"[GST REPORT] Delhivery returned {resp.status_code}: {resp.text[:200]}")
                    continue
                for entry in resp.json().get("ShipmentData", []) or []:
                    shp = entry.get("Shipment", {}) or {}
                    if shp.get("AWB"):
                        shipments[str(shp.get("AWB"))] = shp
            except Exception as e:
                print(f"[GST REPORT] Delhivery fetch error: {e}")

    divisor = 1 + gst_rate / 100
    rows, missing = [], []
    state_summary = {}

    def add_row(local_dt, order_id, awb, state, total, source, channel, delivered_date="", qty=0, payment=""):
        state = _normalize_state(state)
        total = round(total, 2)
        taxable = round(total / divisor, 2)
        gst = round(total - taxable, 2)
        intra = state.lower() == seller_state.lower()
        cgst = round(gst / 2, 2) if intra else 0.0
        sgst = round(gst - cgst, 2) if intra else 0.0
        igst = 0.0 if intra else gst

        row = {
            "date": local_dt.strftime("%Y-%m-%d") if local_dt else "",
            "deliveredDate": delivered_date or "",
            "orderId": order_id,
            "awb": awb,
            "channel": channel,
            "payment": payment or "",
            "qty": qty,
            "state": state or "Unknown",
            "taxable": taxable,
            "cgst": cgst,
            "sgst": sgst,
            "igst": igst,
            "gst": gst,
            "total": total,
            "source": source
        }
        rows.append(row)

        key = state or "Unknown"
        summary_row = state_summary.setdefault(key, {"state": key, "orders": 0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "igst": 0.0, "gst": 0.0, "total": 0.0})
        summary_row["orders"] += 1
        for k in ["taxable", "cgst", "sgst", "igst", "gst", "total"]:
            summary_row[k] = round(summary_row[k] + row[k], 2)

    def in_range(local_dt):
        day = local_dt.strftime("%Y-%m-%d") if local_dt else ""
        if from_date and (not day or day < from_date):
            return False
        if to_date and (not day or day > to_date):
            return False
        return True

    for o, awb, local_dt in selected:
        channel = "Offline" if o.get("isOffline") else "Online"
        shp = shipments.get(awb)
        if not shp:
            # Delhivery returned nothing for this AWB: keep the sale (so GST is not under-reported) but flag it
            missing.append(awb)
            item_qty = sum(int(i.get("quantity") or 1) for i in (o.get("cartItems") or [])) or 1
            add_row(local_dt, o.get("orderId"), awb, str((o.get("shippingAddress") or {}).get("state") or "").strip(),
                    float(o.get("grandTotal") or 0), "missing", channel, "", item_qty, "")
            continue

        st = shp.get("Status", {}) or {}
        st_name = str(st.get("Status") or "").upper()
        st_type = str(st.get("StatusType") or "").upper()
        if st_type == "RT" or st_name in ["RTO", "CANCELLED"] or "CANCEL" in st_name or shp.get("RTOStartedDate") or shp.get("ReturnedDate"):
            continue

        state = str((shp.get("Consignee") or {}).get("State") or "").strip()
        try:
            total = float(shp.get("InvoiceAmount") or 0)
        except (TypeError, ValueError):
            total = 0.0
        try:
            qty = int(float(shp.get("Quantity") or 0))
        except (TypeError, ValueError):
            qty = 0

        delivered_date = ""
        if shp.get("DeliveryDate"):
            delivered_date = str(shp.get("DeliveryDate"))[:10]
        elif st_name == "DELIVERED" and st.get("StatusDateTime"):
            delivered_date = str(st.get("StatusDateTime"))[:10]

        source = "delhivery" if state and total > 0 else "missing"
        add_row(local_dt, shp.get("ReferenceNo") or o.get("orderId"), awb, state, total, source, channel,
                delivered_date, qty, str(shp.get("OrderType") or ""))

    # Offline sales not shipped through Delhivery (sold directly); placeholder state means sold at the store
    offline_placeholders = ["", "offline store", "offline"]
    offline_orders = await orders_collection.find({"isOffline": True}).to_list(length=None)
    for o in offline_orders:
        if (o.get("fulfillment") or {}).get("awb") or _is_excluded_from_gst(o):
            continue
        local_dt = order_date_ist(o)
        if not in_range(local_dt):
            continue
        state = str((o.get("shippingAddress") or {}).get("state") or "").strip()
        if state.lower() in offline_placeholders:
            state = seller_state
        item_qty = sum(int(i.get("quantity") or 1) for i in (o.get("cartItems") or [])) or 1
        add_row(local_dt, o.get("orderId"), "", state, float(o.get("grandTotal") or 0), "order", "Offline",
                local_dt.strftime("%Y-%m-%d") if local_dt else "", item_qty, str(o.get("paymentMethod") or ""))

    # Manual orders: counted once Delivered, same as revenue stats
    manual_orders = await manual_orders_collection.find({"status": "Delivered"}).to_list(length=None)
    for mo in manual_orders:
        local_dt = order_date_ist({"created_at": mo.get("saleDateTime") or mo.get("created_at")})
        if not in_range(local_dt):
            continue
        state = str(mo.get("state") or "").strip() or seller_state
        try:
            total = float(mo.get("totalPrice") or 0)
        except (TypeError, ValueError):
            total = 0.0
        delivered_dt = order_date_ist({"created_at": mo.get("updated_at")}) if mo.get("updated_at") else None
        delivered_date = delivered_dt.strftime("%Y-%m-%d") if delivered_dt else (local_dt.strftime("%Y-%m-%d") if local_dt else "")
        add_row(local_dt, mo.get("orderId") or str(mo.get("_id")), "", state, total, "order", "Manual", delivered_date,
                int(mo.get("numberOfSoaps") or 1), str(mo.get("paymentMethod") or ""))

    rows.sort(key=lambda r: (r["date"], str(r["orderId"])))
    summary = sorted(state_summary.values(), key=lambda x: x["state"])
    totals = {"orders": len(rows)}
    for k in ["taxable", "cgst", "sgst", "igst", "gst", "total"]:
        totals[k] = round(sum(r[k] for r in rows), 2)

    return {
        "rows": rows,
        "stateSummary": summary,
        "totals": totals,
        "sellerState": seller_state,
        "sellerGstin": (config.get("gst_number") or "").strip().upper(),
        "gstRate": gst_rate,
        "from": from_date,
        "to": to_date,
        "missing": missing
    }

@router.get("/api/orders/track/{tracking_id}")
async def track_order_shipment(tracking_id: str):
    clean_id = tracking_id.strip()
    
    # 1. Search database by Order ID or fulfillment AWB
    order = await orders_collection.find_one({
        "$or": [
            {"orderId": clean_id},
            {"fulfillment.awb": clean_id}
        ]
    })
    
    awb = None
    order_id = clean_id
    if order:
        order_id = order.get("orderId", clean_id)
        fulfillment = order.get("fulfillment", {})
        awb = fulfillment.get("awb")
    else:
        # If not found in mongo, assume tracking_id itself might be the Delhivery AWB number
        awb = clean_id

    order_info = None
    if order:
        current_status = str(order.get("status", "")).lower()
        fulfillment_status = str(order.get("fulfillment", {}).get("status", "")).lower()
        shipped_statuses = [
            "shipped", "manifested", "in transit", "in_transit", 
            "dispatched", "out for delivery", "out_for_delivery", 
            "delivered", "pickup scheduled", "pickup_scheduled", "rto delivered"
        ]
        is_cancelled = current_status == "cancelled" or fulfillment_status == "cancelled"
        is_shipped = (
            current_status in shipped_statuses or
            fulfillment_status in shipped_statuses or
            bool(order.get("fulfillment", {}).get("awb")) or
            bool(order.get("fulfillment", {}).get("pickup_scheduled"))
        )
        can_cancel = not is_shipped and not is_cancelled

        def _format_utc_ts(val):
            if not val:
                val = datetime.utcnow()
            if isinstance(val, datetime):
                return val.isoformat() + "Z"
            s = str(val).strip()
            if not s.endswith("Z") and not s.endswith("+00:00"):
                return s.replace(" ", "T") + "Z"
            return s

        order_info = {
            "order_id": order.get("orderId"),
            "order_status": "cancelled" if is_cancelled else (order.get("status") or "confirmed"),
            "can_cancel": can_cancel,
            "grand_total": order.get("grandTotal"),
            "cart_items": order.get("cartItems", []),
            "created_at": _format_utc_ts(order.get("created_at")),
            "payment_method": order.get("paymentMethod"),
            "shipping_address": order.get("shippingAddress", {})
        }

    config = await get_delhivery_config_internal()
    
    if not awb:
        # Order exists in mongo but no shipment created yet
        created_ts = _format_utc_ts(order.get("created_at") if order else None)
        return {
            "status": "success",
            "order_id": order_id,
            "status_name": "Cancelled" if (order_info and order_info.get("order_status") == "cancelled") else "Order Placed",
            "status_time": created_ts,
            "scans": [
                {"time": created_ts, "activity": "Order Received & Confirmed. Preparing shipment.", "location": "Hausmade Soap Shop"}
            ],
            "expected_date": "3-5 Business Days",
            "order_info": order_info
        }

    # If Delhivery is inactive / demo mode
    if not config or not config.get("active") or not config.get("api_token"):
        status_time = _format_utc_ts(order.get("fulfillment", {}).get("shipped_at") if order else None)
        created_ts = _format_utc_ts(order.get("created_at") if order else None)
        return {
            "status": "success",
            "waybill": awb,
            "order_id": order_id,
            "status_name": "Cancelled" if (order_info and order_info.get("order_status") == "cancelled") else "In Transit",
            "status_time": status_time,
            "scans": [
                {"time": status_time, "activity": "Dispatched via Delhivery Express", "location": "Surat Hub"},
                {"time": created_ts, "activity": "Order Confirmed by Store", "location": "Hausmade Soap Shop"}
            ],
            "expected_date": "Within 3-4 Business Days",
            "order_info": order_info
        }

    # Live Delhivery tracking API query
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    url = f"{base_url}/api/v2/packages/json/?waybill={awb}"
    headers = {"Authorization": f"Token {token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                
                status_name = "In Transit"
                status_time = datetime.utcnow().isoformat()
                expected_date = "3-4 Business Days"
                scans = []
                
                # Format 1: ShipmentData -> Shipment
                shipment_list = data.get("ShipmentData", [])
                if shipment_list and isinstance(shipment_list, list):
                    shipment = shipment_list[0].get("Shipment", {})
                    st = shipment.get("Status", {})
                    status_name = st.get("Status") or status_name
                    status_time = st.get("StatusDateTime") or status_time
                    expected_date = shipment.get("ExpectedDeliveryDate") or expected_date
                    
                    raw_scans = shipment.get("Scans", [])
                    for item in raw_scans:
                        detail = item.get("ScanDetail", {}) if isinstance(item, dict) else {}
                        if detail:
                            scans.append({
                                "time": detail.get("ScanDateTime"),
                                "activity": detail.get("Instructions") or detail.get("Scan") or "In Transit",
                                "location": detail.get("ScannedLocation") or "Hub"
                            })
                elif "ScanHistory" in data:
                    status_name = data.get("Status", {}).get("Status") or status_name
                    status_time = data.get("Status", {}).get("StatusDateTime") or status_time
                    expected_date = data.get("ExpectedDeliveryDate") or expected_date
                    for s in data.get("ScanHistory", []):
                        scans.append({
                            "time": s.get("ScanDateTime"),
                            "activity": s.get("Instructions") or s.get("Status"),
                            "location": s.get("ScannedLocation")
                        })
                        
                if not scans:
                    scans.append({
                        "time": status_time,
                        "activity": "Shipment Manifested on Delhivery Express network",
                        "location": config.get("pickup_city") or "Surat Hub"
                    })
                    
                if order_info and order_info.get("order_status") == "cancelled":
                    status_name = "Cancelled"

                return {
                    "status": "success",
                    "waybill": awb,
                    "order_id": order_id,
                    "status_name": status_name,
                    "status_time": status_time,
                    "scans": scans,
                    "expected_date": str(expected_date),
                    "order_info": order_info
                }
            else:
                if not order and not awb.startswith("DELHIVERY"):
                    raise HTTPException(status_code=404, detail="Tracking details not found for this identifier")
                return {
                    "status": "fallback",
                    "waybill": awb,
                    "order_id": order_id,
                    "status_name": "Cancelled" if (order_info and order_info.get("order_status") == "cancelled") else "Manifested",
                    "status_time": datetime.utcnow().isoformat(),
                    "scans": [
                        {"time": datetime.utcnow().isoformat(), "activity": "Shipment registered with Delhivery. Awaiting pickup.", "location": config.get("pickup_city") or "Origin Warehouse"}
                    ],
                    "expected_date": "Awaiting pickup",
                    "order_info": order_info
                }
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            return {
                "status": "fallback",
                "waybill": awb,
                "order_id": order_id,
                "status_name": "Cancelled" if (order_info and order_info.get("order_status") == "cancelled") else "In Transit",
                "status_time": datetime.utcnow().isoformat(),
                "scans": [
                    {"time": datetime.utcnow().isoformat(), "activity": "Dispatched via Delhivery Express", "location": config.get("pickup_city") or "Surat Hub"}
                ],
                "expected_date": "3-4 Business Days",
                "order_info": order_info
            }

@router.post("/api/guest/orders/cancel")
async def cancel_guest_order(req: GuestOrderCancelRequest):
    clean_id = req.orderId.strip()
    clean_contact = req.emailOrPhone.strip().lower()
    
    if not clean_id or not clean_contact:
        raise HTTPException(status_code=400, detail="Order ID and Email/Phone are required.")
        
    order = await orders_collection.find_one({"orderId": clean_id})
    if not order:
        order = await orders_collection.find_one({"orderId": {"$regex": f"^{clean_id}$", "$options": "i"}})
    if not order:
        try:
            from bson import ObjectId
            order = await orders_collection.find_one({"_id": ObjectId(clean_id)})
        except Exception:
            pass
            
    if not order:
        raise HTTPException(status_code=404, detail="Order not found. Please check your Order ID.")
        
    shipping = order.get("shippingAddress", {}) or {}
    order_email = str(shipping.get("email") or order.get("user_email") or "").strip().lower()
    order_phone = str(shipping.get("phone") or "").strip().lower()
    
    clean_digits = "".join(filter(str.isdigit, clean_contact))
    phone_digits = "".join(filter(str.isdigit, order_phone))

    email_match = bool(clean_contact and order_email and clean_contact == order_email)
    phone_match = bool(clean_digits and phone_digits and (clean_digits in phone_digits or phone_digits in clean_digits))

    if not email_match and not phone_match:
        raise HTTPException(
            status_code=400, 
            detail="The Email ID or Phone number does not match the details registered with this order."
        )
        
    current_status = str(order.get("status", "")).lower()
    fulfillment = order.get("fulfillment", {}) or {}
    fulfillment_status = str(fulfillment.get("status", "")).lower()
    
    if current_status == "cancelled" or fulfillment_status == "cancelled":
        return {"status": "success", "message": "Order is already cancelled."}

    shipped_statuses = [
        "shipped", "manifested", "in transit", "in_transit", 
        "dispatched", "out for delivery", "out_for_delivery", 
        "delivered", "pickup scheduled", "pickup_scheduled", "rto delivered"
    ]

    is_shipped = (
        current_status in shipped_statuses or
        fulfillment_status in shipped_statuses or
        bool(fulfillment.get("awb")) or
        bool(fulfillment.get("pickup_scheduled"))
    )

    if is_shipped:
        raise HTTPException(
            status_code=400, 
            detail="Order has already been shipped and cannot be cancelled automatically. Please contact customer support."
        )

    awb = fulfillment.get("awb")
    if awb:
        try:
            config = await get_delhivery_config_internal()
            if config and config.get("active") and config.get("api_token"):
                token = config["api_token"]
                mode = config.get("mode", "test")
                base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
                url = f"{base_url}/api/p/edit"
                payload = {"waybill": awb, "cancellation": "true"}
                headers = {"Authorization": f"Token {token}", "Content-Type": "application/json"}
                async with httpx.AsyncClient() as client:
                    await client.post(url, json=payload, headers=headers, timeout=10.0)
        except Exception as e:
            print(f"Error voiding Delhivery AWB {awb}: {e}")

    update_data = {
        "status": "cancelled",
        "cancelled_at": datetime.utcnow().isoformat(),
        "cancelled_by": "customer"
    }
    if order.get("fulfillment"):
        update_data["fulfillment.status"] = "Cancelled"

    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": update_data}
    )

    return {
        "status": "success",
        "message": "Order has been cancelled successfully.",
        "orderId": order.get("orderId")
    }

@router.post("/api/user/orders/{order_id}/cancel")
async def cancel_user_order(order_id: str, current_user_email: str = Depends(get_current_user_email)):
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        try:
            from bson import ObjectId
            order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        except Exception:
            pass
            
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    current_status = str(order.get("status", "")).lower()
    fulfillment = order.get("fulfillment", {}) or {}
    fulfillment_status = str(fulfillment.get("status", "")).lower()
    
    if current_status == "cancelled" or fulfillment_status == "cancelled":
        return {"status": "success", "message": "Order is already cancelled."}

    shipped_statuses = [
        "shipped", "manifested", "in transit", "in_transit", 
        "dispatched", "out for delivery", "out_for_delivery", 
        "delivered", "pickup scheduled", "pickup_scheduled", "rto delivered"
    ]

    is_shipped = (
        current_status in shipped_statuses or
        fulfillment_status in shipped_statuses or
        bool(fulfillment.get("awb")) or
        bool(fulfillment.get("pickup_scheduled"))
    )

    # Block cancellation if already shipped or delivered
    if is_shipped:
        raise HTTPException(
            status_code=400, 
            detail="Order has already been shipped and cannot be cancelled automatically. Please contact support for assistance."
        )

    # Cancel Delhivery shipment if AWB exists
    awb = fulfillment.get("awb")
    if awb:
        try:
            config = await get_delhivery_config_internal()
            if config and config.get("active") and config.get("api_token"):
                token = config["api_token"]
                mode = config.get("mode", "test")
                base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
                url = f"{base_url}/api/p/edit"
                payload = {"waybill": awb, "cancellation": "true"}
                headers = {"Authorization": f"Token {token}", "Content-Type": "application/json"}
                async with httpx.AsyncClient() as client:
                    await client.post(url, json=payload, headers=headers, timeout=10.0)
        except Exception as e:
            print(f"Error voiding Delhivery AWB {awb}: {e}")

    # Update order status to cancelled
    update_data = {
        "status": "cancelled",
        "cancelled_at": datetime.utcnow().isoformat(),
        "cancelled_by": "customer"
    }
    if order.get("fulfillment"):
        update_data["fulfillment.status"] = "Cancelled"

    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": update_data}
    )

    return {
        "status": "success",
        "message": "Order has been cancelled successfully.",
        "orderId": order.get("orderId")
    }

async def fetch_delhivery_seller_info(config: dict, awb: str) -> dict:
    """Read the seller name and GST number Delhivery has on record for this shipment (packing slip API)."""
    info = {"name": "", "gst": ""}
    if not config.get("active") or not config.get("api_token") or awb.startswith("DELHIVERY"):
        return info
    base_url = "https://staging-express.delhivery.com" if config.get("mode", "test") == "test" else "https://track.delhivery.com"
    url = f"{base_url}/api/p/packing_slip?wbns={awb}"
    headers = {"Authorization": f"Token {config['api_token']}", "Accept": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=10.0)
        if resp.status_code != 200:
            return info
        packages = resp.json().get("packages") or []
        if not packages:
            return info
        package = packages[0]
        for key in ("seller_gst_tin", "client_gst_tin", "tin"):
            value = str(package.get(key) or "").strip()
            if value and value.lower() != "none":
                info["gst"] = value.upper()
                break
        # Seller name: explicit "snm", else the brand part of the client code (e.g. "1b55cf-HAUSMADE-do" -> "HAUSMADE")
        name = str(package.get("snm") or "").strip()
        if not name:
            parts = str(package.get("cl") or "").strip().split("-")
            name = "-".join(parts[1:-1]) if len(parts) >= 3 else "-".join(parts)
        info["name"] = name.strip()
    except Exception as e:
        print(f"Delhivery seller info fetch exception for {awb}: {e}")
    return info

@router.get("/api/orders/label/{awb}", response_class=HTMLResponse)
@router.get("/api/orders/track/{awb}/mock-label", response_class=HTMLResponse)
async def generate_delhivery_shipping_label(awb: str):
    clean_awb = awb.strip()
    
    # 1. Find order in MongoDB
    order = await orders_collection.find_one({
        "$or": [
            {"fulfillment.awb": clean_awb},
            {"orderId": clean_awb},
            {"_id": clean_awb}
        ]
    })
    
    # 2. Get Delhivery settings from DB
    config = await get_delhivery_config_internal() or {}
    
    # 3. Always render our own template (even for already-booked AWBs) so the label
    #    reflects current settings such as the seller GST number.

    # 4. High-Fidelity Official Delhivery Shipping Label Template
    order_id = (order.get("orderId") if order else None) or clean_awb
    shipping = order.get("shippingAddress", {}) if order else {}
    
    customer_name = shipping.get("fullName") or shipping.get("name") or "Valued Customer"
    address = shipping.get("address") or "Customer Address"
    city = shipping.get("city") or "Surat"
    state = shipping.get("state") or "Gujarat"
    pincode = str(shipping.get("pincode") or "395010")
    phone = shipping.get("phone") or "N/A"
    
    fulfillment = order.get("fulfillment", {}) if order else {}
    f_pmode = str(fulfillment.get("payment_mode", "")).strip().upper() if fulfillment else ""
    if f_pmode in ["COD", "PREPAID"]:
        is_cod = f_pmode == "COD"
    else:
        pm = str(order.get("paymentMethod", "")).strip().lower() if order else ""
        pstatus = str(order.get("payment_status", "")).strip().upper() if order else ""
        is_cod = pm in ["cod", "cash", "cash on delivery", "cash_on_delivery", "offline"] or pstatus == "COD"
    
    pmode = "COD" if is_cod else "PREPAID"
    try:
        grand_total = float(order.get("grandTotal", 0.0) or 0.0) if order else 0.0
    except (ValueError, TypeError):
        grand_total = 0.0
    
    cart_items = order.get("cartItems", []) if order else []
    items_desc = ", ".join([f"{item.get('title', 'Botanical Soap')} (x{item.get('quantity', 1)})" for item in cart_items]) if cart_items else "Botanical Cleanse Bars (75g)"
    total_qty = sum(item.get("quantity", 1) for item in cart_items) if cart_items else 1
    
    delhivery_seller = await fetch_delhivery_seller_info(config, clean_awb)
    shipper_name = delhivery_seller["name"] or config.get("pickup_name") or "Hausmade Soap Shop"
    shipper_add = config.get("pickup_address") or "305 Muktidham Society, Dabholi"
    shipper_city = config.get("pickup_city") or "Surat"
    shipper_state = config.get("pickup_state") or "Gujarat"
    shipper_pin = str(config.get("pickup_pincode") or "395010")
    shipper_phone = config.get("pickup_phone") or "7600081431"
    # Admin-entered GST (Delhivery settings) wins; otherwise fall back to what Delhivery has on record.
    shipper_gst = (config.get("gst_number") or "").strip().upper() or delhivery_seller["gst"] or "N/A"
    shipped_date = datetime.utcnow().strftime("%Y-%m-%d")
    shipped_time = datetime.utcnow().strftime("%H:%M:%S")
    mode_tag = (config.get("mode", "test") if config else "TEST").upper()

    import os
    import base64
    
    # Dynamically find the logo path relative to this file's location
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
    logo_path = os.path.join(root_dir, "frontend", "public", "images", "delhivery-logo.png")
    
    logo_html = '<h1>DELHIVERY</h1>'
    try:
        if os.path.exists(logo_path):
            with open(logo_path, "rb") as f:
                logo_b64 = base64.b64encode(f.read()).decode('utf-8')
                logo_html = f'<img src="data:image/png;base64,{logo_b64}" style="width: 170px; height: auto; mix-blend-mode: multiply;" alt="DELHIVERY" />'
    except Exception as e:
        print(f"Error loading logo: {e}")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Label - {clean_awb}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        body {{
            font-family: 'Times New Roman', Times, serif;
            margin: 0;
            background: #e9ecef;
            padding-top: 80px;
            display: flex;
            justify-content: center;
        }}
        .pdf-toolbar {{
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: #fff;
            padding: 0 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 10001;
            box-sizing: border-box;
            border-bottom: 1px solid #ddd;
        }}
        .toolbar-title {{
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }}
        .toolbar-actions {{
            display: flex;
            gap: 12px;
        }}
        .pdf-toolbar button {{
            background: #000;
            color: #fff;
            border: none;
            padding: 8px 20px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
        }}
        .pdf-toolbar button:hover {{ background: #333; }}
        
        #pdf-wrapper {{
            background: #fff;
            padding: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 40px;
        }}
        .label-container {{
            width: 380px;
            border: 2px solid #000;
            background: #fff;
            box-sizing: border-box;
            overflow: hidden;
        }}
        .row {{
            display: flex;
            border-bottom: 2px solid #000;
            box-sizing: border-box;
        }}
        .row:last-child {{ border-bottom: none; }}
        .col {{ padding: 6px; box-sizing: border-box; }}
        .border-right {{ border-right: 2px solid #000; }}
        
        /* Top Row */
        .top-row {{ height: 42px; align-items: center; padding: 0; }}
        .seller-name {{ font-size: 15px; font-weight: normal; font-family: Arial, sans-serif; width: 33%; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center; padding: 0; color: #000; }}
        .delhivery-logo {{ width: 67%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 0; overflow: hidden; }}
        .delhivery-logo h1 {{ margin: 0; font-family: Arial, sans-serif; letter-spacing: 2px; }}
        
        /* Barcode Row */
        .barcode-row {{ flex-direction: column; align-items: center; padding: 12px 0 8px 0; }}
        #awb-barcode {{ width: 85%; height: auto; margin-bottom: 0px; }}
        
        /* Routing Row */
        .routing-row {{ justify-content: space-between; padding: 3px 8px; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; }}
        
        /* Ship To Row */
        .ship-to-row {{ min-height: 115px; }}
        .ship-left {{ width: 75%; font-size: 12px; line-height: 1.25; padding: 5px; }}
        .ship-right {{ width: 25%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; text-align: center; }}
        .consignee-name {{ font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }}
        
        /* Seller Info Row */
        .seller-info-row {{ min-height: 55px; font-size: 11px; }}
        .seller-left {{ width: 75%; line-height: 1.3; padding: 5px; }}
        .seller-right {{ width: 25%; padding: 5px; line-height: 1.3; }}
        
        /* Table Rows */
        .table-row {{ font-size: 11px; align-items: stretch; }}
        .col-prod {{ width: 60%; display: flex; align-items: center; padding: 3px 5px; }}
        .col-price {{ width: 20%; text-align: center; display: flex; align-items: center; justify-content: center; padding: 3px; }}
        .col-total {{ width: 20%; text-align: center; display: flex; align-items: center; justify-content: center; padding: 3px; }}
        .product-list {{ min-height: 55px; }}
        .total-row {{ height: 22px; font-size: 12px; }}
        
        /* Small Barcode Row */
        .small-barcode-row {{ flex-direction: column; align-items: center; padding: 6px 0 2px 0; }}
        #order-barcode {{ height: 35px; width: 50%; }}
        .order-text {{ font-size: 9px; font-family: Arial, sans-serif; font-weight: bold; margin-top: 4px; margin-bottom: 3px; }}
        
        /* Return Address */
        .return-addr-row {{ font-size: 10px; padding: 4px 8px; line-height: 1.2; }}
        
        @media print {{
            body {{ background: #fff; padding: 0; height: 100vh; }}
            .pdf-toolbar {{ display: none !important; }}
            #pdf-wrapper {{ box-shadow: none; margin: 0; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="pdf-toolbar">
        <div class="toolbar-title">Shipping Label</div>
        <div class="toolbar-actions">
            <button onclick="window.print()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print Label
            </button>
        </div>
    </div>
    
    <div id="pdf-wrapper">
        <div class="label-container">
            <div class="row top-row">
                <div class="col border-right seller-name">{shipper_name}</div>
                <div class="col delhivery-logo">
                    {logo_html}
                </div>
            </div>
            
            <div class="row barcode-row">
                <svg id="awb-barcode"></svg>
            </div>
            
            <div class="row routing-row">
                <div>{shipper_pin}</div>
                <div>{pincode[:3]}/GCI</div>
            </div>
            
            <div class="row ship-to-row">
                <div class="col border-right ship-left">
                    <div><b>Ship To:</b></div>
                    <div class="consignee-name">{customer_name}</div>
                    <div>{address}</div>
                    <div>{city}_{state} (Gujarat)</div>
                    <div><strong>PIN:{pincode}</strong></div>
                </div>
                <div class="col ship-right">
                    <div style="font-weight: 900; margin-bottom: 2px;">{'COD' if is_cod else 'PREPAID'}</div>
                    <div style="font-weight: normal;">Surface</div>
                    <div style="margin-top: 10px; font-weight: 900;">INR</div>
                    <div style="font-weight: 900;">{int(grand_total)}</div>
                </div>
            </div>
            
            <div class="row seller-info-row">
                <div class="col border-right seller-left">
                    <div><strong>Seller:</strong> {shipper_name}</div>
                    <div><strong>Address:</strong> {shipper_add},</div>
                    <div style="padding-left: 55px;">{shipper_city}, {shipper_state}</div>
                    <div><strong>GST:</strong> {shipper_gst}</div>
                </div>
                <div class="col seller-right">
                    <div><strong>Date:</strong><br>{shipped_date}<br>{shipped_time}</div>
                </div>
            </div>
            
            <div class="row table-row">
                <div class="col border-right col-prod">Product(Qty)</div>
                <div class="col border-right col-price">Price</div>
                <div class="col col-total">Total</div>
            </div>
            
            <div class="row table-row product-list">
                <div class="col border-right col-prod">{items_desc}</div>
                <div class="col border-right col-price">INR {int(grand_total)}</div>
                <div class="col col-total">INR {int(grand_total)}</div>
            </div>
            
            <div class="row table-row total-row">
                <div class="col border-right col-prod">Total</div>
                <div class="col border-right col-price">INR {int(grand_total)}</div>
                <div class="col col-total">INR {int(grand_total)}</div>
            </div>
            
            <div class="row small-barcode-row">
                <svg id="order-barcode"></svg>
                <div class="order-text">{order_id}</div>
            </div>
            
            <div class="return-addr-row">
                Return Address: {shipper_add}, {shipper_city}, {shipper_state}, Gujarat
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {{
            JsBarcode("#awb-barcode", "{clean_awb}", {{
                format: "CODE128", displayValue: true, fontSize: 14, textMargin: 4, margin: 0, height: 50, width: 2.2
            }});
            JsBarcode("#order-barcode", "{order_id}", {{
                format: "CODE128", displayValue: false, margin: 0, height: 35, width: 1.5
            }});
            
            // Auto-trigger print dialog after a brief moment so barcodes render
            setTimeout(() => {{
                window.print();
            }}, 500);
        }};
    </script>
</body>
</html>"""
    
    return HTMLResponse(content=html_content)
