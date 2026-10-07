import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.models import ManualOrderCreate, ManualOrderStatusUpdate
from app.database.connection import manual_orders_collection
from app.dependencies.auth_deps import get_admin_user

router = APIRouter(tags=["Manual Orders"])

def format_doc(doc):
    if not doc:
        return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

import random

@router.post("/api/admin/manual-orders", status_code=201)
async def create_manual_order(order_data: ManualOrderCreate, admin: dict = Depends(get_admin_user)):
    try:
        random_digits = "".join([str(random.randint(0, 9)) for _ in range(6)])
        order_id = f"OFF-{random_digits}"

        status = order_data.status if order_data.status in ["Pending", "Delivered"] else "Pending"
        
        sale_dt = order_data.saleDateTime
        if not sale_dt:
            sale_dt = datetime.now().isoformat()

        doc = {
            "orderId": order_id,
            "customerName": order_data.customerName,
            "customerPhone": order_data.customerPhone,
            "customerEmail": order_data.customerEmail,
            "numberOfSoaps": order_data.numberOfSoaps,
            "pricePerSoap": order_data.pricePerSoap,
            "totalPrice": order_data.totalPrice,
            "paymentMethod": order_data.paymentMethod or "COD",
            "saleDateTime": sale_dt,
            "created_at": sale_dt,
            "address": order_data.address,
            "city": order_data.city,
            "state": order_data.state,
            "pincode": order_data.pincode,
            "notes": order_data.notes,
            "status": status,
            "isManualOrder": True
        }

        result = await manual_orders_collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return doc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/admin/manual-orders")
async def get_manual_orders(admin: dict = Depends(get_admin_user)):
    try:
        orders = await manual_orders_collection.find({}).to_list(length=None)
        formatted = [format_doc(o) for o in orders]
        # Sort by created_at descending
        formatted.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/api/admin/manual-orders/{order_id}/status")
async def update_manual_order_status(order_id: str, payload: ManualOrderStatusUpdate, admin: dict = Depends(get_admin_user)):
    try:
        new_status = payload.status
        if new_status not in ["Pending", "Delivered"]:
            raise HTTPException(status_code=400, detail="Status must be either 'Pending' or 'Delivered'")

        query = {"$or": [{"orderId": order_id}, {"_id": order_id}]}
        order = await manual_orders_collection.find_one(query)
        if not order:
            from bson import ObjectId
            try:
                query = {"_id": ObjectId(order_id)}
                order = await manual_orders_collection.find_one(query)
            except Exception:
                pass

        if not order:
            all_orders = await manual_orders_collection.find({}).to_list(length=None)
            for o in all_orders:
                if str(o.get("_id")) == order_id or str(o.get("orderId")) == order_id:
                    query = {"_id": o["_id"]}
                    order = o
                    break

        if not order:
            raise HTTPException(status_code=404, detail="Manual order not found")

        await manual_orders_collection.update_one(query, {"$set": {"status": new_status, "updated_at": datetime.now().isoformat()}})
        updated = await manual_orders_collection.find_one(query)
        return format_doc(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/admin/manual-orders/{order_id}")
async def delete_manual_order(order_id: str, admin: dict = Depends(get_admin_user)):
    try:
        query = {"orderId": order_id}
        order = await manual_orders_collection.find_one(query)
        if not order:
            from bson import ObjectId
            try:
                query = {"_id": ObjectId(order_id)}
                order = await manual_orders_collection.find_one(query)
            except Exception:
                pass

        if not order:
            raise HTTPException(status_code=404, detail="Manual order not found")

        await manual_orders_collection.delete_one(query)
        return {"success": True, "message": "Manual order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
