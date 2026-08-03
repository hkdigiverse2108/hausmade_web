from typing import Optional
from datetime import datetime
import uuid
import httpx
import hmac
import hashlib
import base64
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import HTMLResponse, Response
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

async def process_delhivery_shipment_booking(order_or_id, weight=500, length=15, width=15, height=10):
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

    waybill = real_awb or f"DELHIVERY{str(uuid.uuid4().int)[:10]}"

    pmode = "COD" if order.get("paymentMethod") in ["cod", "COD"] else "Prepaid"
    cod_amt = float(order.get("grandTotal", 0.0)) if pmode == "COD" else 0.0
    
    warehouse_name = config.get("warehouse_name") or config.get("pickup_name") or "Hausmade Soaps"

    # Sanitize phone number (remove +91, leading 0, spaces)
    raw_phone = order.get("shippingAddress", {}).get("phone", "")
    clean_phone = ''.join(filter(str.isdigit, raw_phone))
    if clean_phone.startswith("91") and len(clean_phone) > 10:
        clean_phone = clean_phone[2:]
    if clean_phone.startswith("0") and len(clean_phone) > 10:
        clean_phone = clean_phone[1:]
    
    # Ensure address is at least 12 chars for Delhivery
    raw_address = order.get("shippingAddress", {}).get("address", "")
    if len(raw_address) < 12:
        raw_address = raw_address + " - " + order.get("shippingAddress", {}).get("city", "")

    shipment_data = {
        "shipments": [
            {
                "waybill": waybill,
                "name": order.get("shippingAddress", {}).get("fullName", "Customer"),
                "add": raw_address,
                "pin": order.get("shippingAddress", {}).get("pincode", "395010"),
                "city": order.get("shippingAddress", {}).get("city", "Surat"),
                "state": order.get("shippingAddress", {}).get("state", "Gujarat"),
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
            packages = resp_json.get("packages", [])
            if packages and isinstance(packages, list):
                pkg = packages[0]
                if pkg.get("waybill"):
                    waybill = pkg.get("waybill")
                    
            create_resp = resp_json.get("createOrderResponse", {})
            if isinstance(create_resp, dict) and create_resp.get("errorCode"):
                err_msg = create_resp.get("errorMessage") or f"Error {create_resp.get('errorCode')}"
                raise ValueError(f"Delhivery API Error: {err_msg}")
        except Exception as e:
            raise ValueError(f"Delhivery shipment booking failed: {str(e)}")
            
    fulfillment = {
        "awb": waybill,
        "provider": "Delhivery Express",
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
    
    order = await orders_collection.find_one({"orderId": order_id})
    if not order:
        order = await orders_collection.find_one({"_id": order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
    try:
        fulfillment = await process_delhivery_shipment_booking(order, weight=weight, length=length, width=width, height=height)
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
    
    # Always update DB state so order reflects Pickup Scheduled
    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": {
            "fulfillment.pickup_scheduled": True, 
            "fulfillment.status": "Pickup Scheduled",
            "status": "shipped"
        }}
    )
    
    if not config or not config.get("active") or not config.get("api_token"):
        return {"status": "success", "message": "Pickup scheduled successfully!"}
        
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    
    pickup_location_name = config.get("warehouse_name") or config.get("pickup_name") or "Hausmade Soaps"
    pickup_payload = {
        "pickup_location": pickup_location_name,
        "pickup_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "pickup_time": "14:00:00",
        "expected_package_count": 1
    }
    
    url = f"{base_url}/fm/request/new/"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    delhivery_notice = ""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=pickup_payload, headers=headers, timeout=10.0)
            if resp.status_code in [200, 201]:
                delhivery_notice = "Pickup request registered with Delhivery network!"
            else:
                try:
                    resp_json = resp.json()
                    if isinstance(resp_json, dict):
                        err_detail = resp_json.get("prepaid") or resp_json.get("error") or resp_json.get("detail")
                        if err_detail:
                            delhivery_notice = f"(Delhivery API: {err_detail})"
                except Exception:
                    pass
        except Exception as e:
            print(f"Delhivery pickup API call exception: {e}")

    msg = "Pickup scheduled successfully!"
    if delhivery_notice:
        msg += f" {delhivery_notice}"

    return {"status": "success", "message": msg}

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

    config = await get_delhivery_config_internal()
    
    if not awb:
        # Order exists in mongo but no shipment created yet
        return {
            "status": "success",
            "order_id": order_id,
            "status_name": "Order Placed",
            "status_time": str(order.get("created_at")) if order else datetime.utcnow().isoformat(),
            "scans": [
                {"time": str(order.get("created_at")) if order else datetime.utcnow().isoformat(), "activity": "Order Received & Confirmed. Preparing shipment.", "location": "Hausmade Soap Shop"}
            ],
            "expected_date": "3-5 Business Days"
        }

    # If Delhivery is inactive / demo mode
    if not config or not config.get("active") or not config.get("api_token"):
        status_time = (order.get("fulfillment", {}).get("shipped_at") if order else None) or datetime.utcnow().isoformat()
        return {
            "status": "success",
            "waybill": awb,
            "order_id": order_id,
            "status_name": "In Transit",
            "status_time": status_time,
            "scans": [
                {"time": status_time, "activity": "Dispatched via Delhivery Express", "location": "Surat Hub"},
                {"time": str(order.get("created_at")) if order else status_time, "activity": "Order Confirmed by Store", "location": "Hausmade Soap Shop"}
            ],
            "expected_date": "Within 3-4 Business Days"
        }

    # Live Delhivery tracking API query
    token = config["api_token"]
    mode = config.get("mode", "test")
    base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://track.delhivery.com"
    url = f"{base_url}/api/v1/packages/json/?waybill={awb}"
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
                    
                return {
                    "status": "success",
                    "waybill": awb,
                    "order_id": order_id,
                    "status_name": status_name,
                    "status_time": status_time,
                    "scans": scans,
                    "expected_date": str(expected_date)
                }
            else:
                if not order and not awb.startswith("DELHIVERY"):
                    raise HTTPException(status_code=404, detail="Tracking details not found for this identifier")
                return {
                    "status": "fallback",
                    "waybill": awb,
                    "order_id": order_id,
                    "status_name": "Manifested",
                    "status_time": datetime.utcnow().isoformat(),
                    "scans": [
                        {"time": datetime.utcnow().isoformat(), "activity": "Shipment registered with Delhivery. Awaiting pickup.", "location": config.get("pickup_city") or "Origin Warehouse"}
                    ],
                    "expected_date": "Awaiting pickup"
                }
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            return {
                "status": "fallback",
                "waybill": awb,
                "order_id": order_id,
                "status_name": "In Transit",
                "status_time": datetime.utcnow().isoformat(),
                "scans": [
                    {"time": datetime.utcnow().isoformat(), "activity": "Dispatched via Delhivery Express", "location": config.get("pickup_city") or "Surat Hub"}
                ],
                "expected_date": "3-4 Business Days"
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
    
    # Block cancellation if already shipped or delivered
    if current_status in ["shipped", "manifested", "in transit", "out for delivery", "delivered"]:
        raise HTTPException(
            status_code=400, 
            detail="Order has already been shipped and cannot be cancelled automatically. Please contact support for assistance."
        )

    if current_status == "cancelled":
        return {"status": "success", "message": "Order is already cancelled."}

    # Cancel Delhivery shipment if AWB exists
    fulfillment = order.get("fulfillment", {})
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
    await orders_collection.update_one(
        {"_id": order["_id"]},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow().isoformat(),
            "cancelled_by": "customer"
        }}
    )

    return {
        "status": "success",
        "message": "Order has been cancelled successfully.",
        "orderId": order.get("orderId")
    }

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
    
    # 3. If connected to live Delhivery API, attempt to fetch official packing slip
    if config.get("active") and config.get("api_token") and not clean_awb.startswith("DELHIVERY"):
        token = config["api_token"]
        mode = config.get("mode", "test")
        base_url = "https://staging-express.delhivery.com" if mode == "test" else "https://express.delhivery.com"
        url = f"{base_url}/api/p/packing_slip?wbns={clean_awb}"
        headers = {"Authorization": f"Token {token}"}
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    content_type = resp.headers.get("content-type", "")
                    if "pdf" in content_type:
                        return Response(content=resp.content, media_type="application/pdf")
                    elif "html" in content_type or resp.text.strip().startswith("<"):
                        return HTMLResponse(content=resp.text)
            except Exception as e:
                print(f"Live Delhivery packing slip fetch exception: {e}")

    # 4. High-Fidelity Official Delhivery Shipping Label Template
    order_id = (order.get("orderId") if order else None) or clean_awb
    shipping = order.get("shippingAddress", {}) if order else {}
    
    customer_name = shipping.get("fullName") or shipping.get("name") or "Valued Customer"
    address = shipping.get("address") or "Customer Address"
    city = shipping.get("city") or "Surat"
    state = shipping.get("state") or "Gujarat"
    pincode = str(shipping.get("pincode") or "395010")
    phone = shipping.get("phone") or "N/A"
    
    pmode = str(order.get("paymentMethod", "")).upper() if order else "PREPAID"
    is_cod = pmode in ["COD", "CASH ON DELIVERY"]
    grand_total = order.get("grandTotal", 0.0) if order else 0.0
    
    cart_items = order.get("cartItems", []) if order else []
    items_desc = ", ".join([f"{item.get('title', 'Botanical Soap')} (x{item.get('quantity', 1)})" for item in cart_items]) if cart_items else "Botanical Cleanse Bars (75g)"
    total_qty = sum(item.get("quantity", 1) for item in cart_items) if cart_items else 1
    
    shipper_name = config.get("pickup_name") or "Hausmade Soap Shop"
    shipper_add = config.get("pickup_address") or "305 Muktidham Society, Dabholi"
    shipper_city = config.get("pickup_city") or "Surat"
    shipper_state = config.get("pickup_state") or "Gujarat"
    shipper_pin = str(config.get("pickup_pincode") or "395010")
    shipper_phone = config.get("pickup_phone") or "7600081431"
    
    shipped_date = datetime.utcnow().strftime("%d %b %Y")
    mode_tag = (config.get("mode", "test") if config else "TEST").upper()
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delhivery Express Label - {clean_awb}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page {{
            size: 4in 6in;
            margin: 0;
        }}
        * {{
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
        }}
        body {{
            background-color: #e2e8f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
        }}
        .no-print-bar {{
            width: 100%;
            max-width: 4.2in;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }}
        .no-print-bar button {{
            background: #7A8B6F;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }}
        .no-print-bar button:hover {{
            background: #68785c;
        }}
        .label-card {{
            width: 4in;
            min-height: 6in;
            background: #ffffff;
            border: 2px solid #000000;
            padding: 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
        }}
        .logo-main {{
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 1px;
            color: #000000;
        }}
        .logo-sub {{
            font-size: 10px;
            font-weight: 800;
            background: #000000;
            color: #ffffff;
            padding: 2px 5px;
            border-radius: 2px;
            margin-left: 4px;
        }}
        .badge-mode {{
            font-size: 9px;
            font-weight: bold;
            border: 1px solid #000;
            padding: 2px 6px;
            border-radius: 4px;
        }}
        .routing-box {{
            display: flex;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            background: #fafafa;
        }}
        .routing-left {{
            flex: 1.2;
            padding-right: 8px;
            border-right: 1px dashed #000;
        }}
        .routing-left .pincode {{
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 1px;
        }}
        .routing-left .city {{
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
        }}
        .routing-right {{
            flex: 0.8;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }}
        .hub-code {{
            font-size: 22px;
            font-weight: 900;
            border: 2px solid #000;
            padding: 2px 10px;
        }}
        .barcode-box {{
            text-align: center;
            padding: 10px 0 6px 0;
            border-bottom: 2px solid #000;
        }}
        #barcode {{
            width: 95%;
            height: 58px;
        }}
        .awb-num {{
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 2px;
            margin-top: 2px;
        }}
        .payment-box {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding: 8px 0;
        }}
        .payment-tag {{
            font-size: 17px;
            font-weight: 900;
            padding: 4px 12px;
            border: 2px solid #000;
        }}
        .payment-tag.cod {{
            background: #000;
            color: #fff;
        }}
        .payment-tag.prepaid {{
            background: #fff;
            color: #000;
        }}
        .order-info {{
            font-size: 10px;
            text-align: right;
            line-height: 1.3;
        }}
        .address-box {{
            padding: 6px 0;
            border-bottom: 1px dashed #000;
            font-size: 10px;
            line-height: 1.3;
        }}
        .addr-title {{
            font-weight: 900;
            font-size: 9px;
            text-transform: uppercase;
            color: #333;
            margin-bottom: 2px;
        }}
        .consignee-name {{
            font-size: 12px;
            font-weight: 800;
        }}
        .shipper-box {{
            padding-top: 6px;
            font-size: 9px;
            line-height: 1.25;
            color: #222;
        }}
        .footer-note {{
            font-size: 8px;
            text-align: center;
            color: #555;
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px solid #ddd;
        }}
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            .no-print-bar {{
                display: none !important;
            }}
            .label-card {{
                box-shadow: none;
                border: 2px solid #000;
                width: 100vw;
                height: 100vh;
            }}
        }}
    </style>
</head>
<body>
    <div class="no-print-bar">
        <div>
            <strong style="font-size: 14px; display: block;">Delhivery Shipping Label</strong>
            <span style="font-size: 11px; opacity: 0.85;">AWB: {clean_awb}</span>
        </div>
        <button onclick="window.print()">🖨️ Print Label</button>
    </div>

    <div class="label-card">
        <div class="header">
            <div>
                <span class="logo-main">DELHIVERY</span>
                <span class="logo-sub">EXPRESS</span>
            </div>
            <div class="badge-mode">{mode_tag} ACCOUNT</div>
        </div>

        <div class="routing-box">
            <div class="routing-left">
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">DESTINATION PINCODE</div>
                <div class="pincode">{pincode}</div>
                <div class="city">{city}, {state}</div>
            </div>
            <div class="routing-right">
                <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px;">SORT CENTER</div>
                <div class="hub-code">{pincode[:3]}</div>
            </div>
        </div>

        <div class="barcode-box">
            <svg id="barcode"></svg>
            <div class="awb-num">AWB: {clean_awb}</div>
        </div>

        <div class="payment-box">
            <div class="payment-tag {'cod' if is_cod else 'prepaid'}">
                {'COD: ₹' + str(int(grand_total)) if is_cod else 'PREPAID'}
            </div>
            <div class="order-info">
                <div><strong>Order ID:</strong> {order_id}</div>
                <div><strong>Date:</strong> {shipped_date}</div>
                <div><strong>Weight:</strong> 500g | Qty: {total_qty}</div>
            </div>
        </div>

        <div class="address-box">
            <div class="addr-title">DELIVER TO (CONSIGNEE):</div>
            <div class="consignee-name">{customer_name}</div>
            <div>{address}</div>
            <div><strong>{city}, {state} - {pincode}</strong></div>
            <div><strong>Phone:</strong> {phone}</div>
        </div>

        <div class="address-box">
            <div class="addr-title">ITEMS & PACKAGE DESC:</div>
            <div style="font-weight: 600;">{items_desc}</div>
        </div>

        <div class="shipper-box">
            <div class="addr-title">RETURN / SHIPPER WAREHOUSE:</div>
            <div style="font-weight: bold;">{shipper_name}</div>
            <div>{shipper_add}, {shipper_city}, {shipper_state} - {shipper_pin}</div>
            <div>Phone: {shipper_phone}</div>
        </div>

        <div class="footer-note">
            Handcrafted Botanical Cleanse & Bath Rituals. Please handle with care. Official Delhivery Express Logistics Partner.
        </div>
    </div>

    <script>
        window.onload = function() {{
            try {{
                JsBarcode("#barcode", "{clean_awb}", {{
                    format: "CODE128",
                    width: 2,
                    height: 58,
                    displayValue: false,
                    margin: 0
                }});
            }} catch(e) {{
                console.error("Barcode error:", e);
            }}
        }};
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)
