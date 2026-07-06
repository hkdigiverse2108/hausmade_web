from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.models import OrderCreate
from app.database.connection import orders_collection, products_collection, users_collection
from app.dependencies.auth_deps import get_current_user_email

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
    
    await orders_collection.insert_one(order_dict)
    order_dict["_id"] = str(order_dict["_id"])
    return order_dict

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
