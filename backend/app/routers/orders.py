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
    
    url = f"{base_url}/api/kbc/v1/pin-codes/json/?filter_codes={pincode}"
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
                if codes:
                    code_info = codes[0].get("postal_code", {})
                    is_serviceable = code_info.get("pin") is not None
                    cod = code_info.get("cod") == "Y"
                    prepaid = code_info.get("prepaid") == "Y"
                    return {
                        "status": "success",
                        "serviceable": is_serviceable,
                        "pincode": pincode,
                        "cod_available": cod,
                        "prepaid_available": prepaid,
                        "provider": "Delhivery",
                        "estimated_days": 4,
                        "cost_estimate": 60.0
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

@router.post("/api/admin/orders/{order_id}/delhivery/ship")
async def create_delhivery_shipment(order_id: str, payload: dict, admin: dict = Depends(get_admin_user)):
    import json
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
    weight = payload.get("weight", 500)
    length = payload.get("length", 15)
    width = payload.get("width", 15)
    height = payload.get("height", 10)
    
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        mock_awb = f"DELHIVERY{str(uuid.uuid4().int)[:10]}"
        fulfillment = {
            "awb": mock_awb,
            "provider": "Delhivery (Demo Mode)",
            "weight": weight,
            "dimensions": f"{length}x{width}x{height} cm",
            "shipped_at": datetime.utcnow().isoformat(),
            "status": "In Transit",
            "pickup_scheduled": False,
            "label_url": f"/api/orders/track/{mock_awb}/mock-label"
        }
        await orders_collection.update_one(
            {"_id": order["_id"]},
            {"$set": {"fulfillment": fulfillment, "status": "shipped"}}
        )
        return {"status": "success", "fulfillment": fulfillment}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
    
    pmode = "COD" if order.get("paymentMethod") in ["cod", "COD"] else "Prepaid"
    cod_amt = float(order.get("grandTotal", 0.0)) if pmode == "COD" else 0.0
    
    shipment_data = {
        "shipments": [
            {
                "name": order["shippingAddress"]["fullName"],
                "add": order["shippingAddress"]["address"],
                "pin": order["shippingAddress"]["pincode"],
                "phone": order["shippingAddress"]["phone"],
                "payment_mode": pmode,
                "cod_amount": cod_amt,
                "order": order.get("orderId", order_id),
                "client": "HAUSMADE",
                "weight": weight,
                "length": length,
                "width": width,
                "height": height,
                "products_desc": "Botanical Cleanse Bars",
                "quantity": sum(item.get("quantity", 1) for item in order.get("cartItems", []))
            }
        ],
        "pickup_location": {
            "name": config.get("pickup_name") or "Hausmade Soap Shop",
            "add": config.get("pickup_address") or "305 Muktidham Society",
            "pin": config.get("pickup_pincode") or "395010",
            "phone": config.get("pickup_phone") or "7600081431",
            "city": config.get("pickup_city") or "Surat",
            "state": config.get("pickup_state") or "Gujarat"
        }
    }
    
    url = f"{base_url}/api/cbn/create/json/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    body_data = {
        "format": "json",
        "data": json.dumps(shipment_data)
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, data=body_data, headers=headers, timeout=15.0)
            if resp.status_code == 200:
                resp_json = resp.json()
                success = resp_json.get("success", False)
                packages = resp_json.get("packages", [])
                if packages:
                    pkg = packages[0]
                    waybill = pkg.get("waybill")
                    if waybill:
                        fulfillment = {
                            "awb": waybill,
                            "provider": "Delhivery",
                            "weight": weight,
                            "dimensions": f"{length}x{width}x{height} cm",
                            "shipped_at": datetime.utcnow().isoformat(),
                            "status": "Manifested",
                            "pickup_scheduled": False,
                            "label_url": f"https://staging-express.delhivery.com/api/p/packaging/status/?wbns={waybill}" if mode == "test" else f"https://express.delhivery.com/api/p/packaging/status/?wbns={waybill}"
                        }
                        await orders_collection.update_one(
                            {"_id": order["_id"]},
                            {"$set": {"fulfillment": fulfillment, "status": "shipped"}}
                        )
                        return {"status": "success", "fulfillment": fulfillment}
                
                raise HTTPException(status_code=400, detail=f"Delhivery shipment booking failed: {resp.text}")
            else:
                raise HTTPException(status_code=400, detail=f"Delhivery API Error ({resp.status_code}): {resp.text}")
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Delhivery: {str(e)}")

@router.post("/api/admin/orders/{order_id}/delhivery/pickup")
async def schedule_delhivery_pickup(order_id: str, admin: dict = Depends(get_admin_user)):
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
            
    fulfillment = order.get("fulfillment", {})
    awb = fulfillment.get("awb")
    if not awb:
        raise HTTPException(status_code=400, detail="Order has not been shipped with Delhivery yet")
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        fulfillment["pickup_scheduled"] = True
        fulfillment["status"] = "In Transit"
        await orders_collection.update_one(
            {"_id": order["_id"]},
            {"$set": {"fulfillment": fulfillment}}
        )
        return {"status": "success", "detail": "Demo pickup scheduled successfully"}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
    
    url = f"{base_url}/fm/request/pickup/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    pickup_payload = {
        "pickup_time": datetime.utcnow().strftime("%H:%M:%S"),
        "pickup_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "pickup_location": config.get("pickup_name") or "Hausmade Soap Shop",
        "expected_package_count": 1
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=pickup_payload, headers=headers, timeout=10.0)
            fulfillment["pickup_scheduled"] = True
            await orders_collection.update_one(
                {"_id": order["_id"]},
                {"$set": {"fulfillment": fulfillment}}
            )
            return {"status": "success", "detail": "Pickup scheduled successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to schedule pickup: {str(e)}")

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
        raise HTTPException(status_code=400, detail="Order has no waybill generated")
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        await orders_collection.update_one(
            {"_id": order["_id"]},
            {"$unset": {"fulfillment": ""}, "$set": {"status": "confirmed"}}
        )
        return {"status": "success", "detail": "Demo shipment cancelled successfully"}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
    
    url = f"{base_url}/api/p/edit/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    cancel_payload = {
        "waybill": awb,
        "cancellation": True
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

@router.get("/api/orders/track/{tracking_id}")
async def track_order_shipment(tracking_id: str):
    order = await orders_collection.find_one({
        "$or": [
            {"orderId": tracking_id},
            {"fulfillment.awb": tracking_id}
        ]
    })
    
    if not order:
        if tracking_id.startswith("DELHIVERY"):
            return {
                "status": "success",
                "waybill": tracking_id,
                "order_id": "ORDER-DEMO-1234",
                "status_name": "In Transit",
                "status_time": datetime.utcnow().isoformat(),
                "scans": [
                    {"time": datetime.utcnow().isoformat(), "activity": "In transit to delivery center", "location": "Surat Warehouse"},
                    {"time": datetime.utcnow().isoformat(), "activity": "Shipment picked up by partner", "location": "Hausmade Soap Shop"}
                ],
                "expected_date": "3 days from now"
            }
        raise HTTPException(status_code=404, detail="Tracking details not found for this identifier")
        
    fulfillment = order.get("fulfillment", {})
    awb = fulfillment.get("awb")
    
    if not awb:
        return {
            "status": "success",
            "order_id": order.get("orderId"),
            "status_name": "Order Placed",
            "status_time": order.get("created_at"),
            "scans": [
                {"time": order.get("created_at"), "activity": "Order Confirmed. Preparing shipment.", "location": "Hausmade Soap Shop"}
            ]
        }
        
    config = await get_delhivery_config_internal()
    if not config or not config.get("active") or not config.get("api_token"):
        status_time = fulfillment.get("shipped_at") or datetime.utcnow().isoformat()
        return {
            "status": "success",
            "waybill": awb,
            "order_id": order.get("orderId"),
            "status_name": "In Transit" if fulfillment.get("pickup_scheduled") else "Manifested",
            "status_time": status_time,
            "scans": [
                {"time": status_time, "activity": "Dispatched via Delhivery Express", "location": "Surat Hub"},
                {"time": order.get("created_at"), "activity": "Order Confirmed by Store", "location": "Hausmade Soap Shop"}
            ],
            "expected_date": "Within 3-4 Business Days"
        }
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    url = f"https://track.delhivery.com/api/v1/packages/json/?waybill={awb}"
    headers = {
        "Authorization": f"Token {token}"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                scans = []
                scan_list = data.get("ScanHistory", [])
                for s in scan_list:
                    scans.append({
                        "time": s.get("ScanDateTime"),
                        "activity": s.get("Instructions") or s.get("Status"),
                        "location": s.get("ScannedLocation")
                    })
                
                if not scans:
                    scans.append({
                        "time": fulfillment.get("shipped_at"),
                        "activity": "Shipment Manifested. Awaiting pickup.",
                        "location": "Origin Warehouse"
                    })
                    
                return {
                    "status": "success",
                    "waybill": awb,
                    "order_id": order.get("orderId"),
                    "status_name": data.get("Status", {}).get("Status") or "In Transit",
                    "status_time": data.get("Status", {}).get("StatusDateTime") or fulfillment.get("shipped_at"),
                    "scans": scans,
                    "expected_date": data.get("ExpectedDeliveryDate") or "3-4 Business Days"
                }
            else:
                return {
                    "status": "fallback",
                    "waybill": awb,
                    "order_id": order.get("orderId"),
                    "status_name": "Manifested",
                    "status_time": fulfillment.get("shipped_at"),
                    "scans": [
                        {"time": fulfillment.get("shipped_at"), "activity": "Shipment registered. Label printed.", "location": "Origin Warehouse"}
                    ],
                    "expected_date": "Awaiting pickup"
                }
        except Exception as e:
            return {
                "status": "fallback",
                "waybill": awb,
                "order_id": order.get("orderId"),
                "status_name": "In Transit (Local Estimate)",
                "status_time": fulfillment.get("shipped_at"),
                "scans": [
                    {"time": fulfillment.get("shipped_at"), "activity": "Dispatched via Delhivery Express (Error reading real-time tracking)", "location": "Origin"}
                ],
                "expected_date": "3-4 Business Days"
            }
