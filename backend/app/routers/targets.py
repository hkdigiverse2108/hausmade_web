from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.models import SalesTargetCreate
from app.database.connection import targets_collection, orders_collection
from app.dependencies.auth_deps import get_admin_user
from datetime import datetime, timezone, time
from bson import ObjectId

router = APIRouter(tags=["Sales Targets"])

@router.post("/api/admin/targets", status_code=201)
async def set_sales_target(target_data: SalesTargetCreate, admin: dict = Depends(get_admin_user)):
    doc = {
        "name": target_data.name,
        "start_date": target_data.start_date,
        "end_date": target_data.end_date,
        "target": target_data.target,
        "created_at": datetime.utcnow()
    }
    await targets_collection.insert_one(doc)
    return {"status": "success", "message": "Sales target created successfully"}

@router.post("/api/admin/targets/range", status_code=201)
async def set_sales_target_range(target_data: dict, admin: dict = Depends(get_admin_user)):
    # Deprecated endpoint to prevent crash
    return {"status": "success", "message": "Deprecated"}

@router.delete("/api/admin/targets/{target_id}")
async def delete_sales_target(target_id: str, admin: dict = Depends(get_admin_user)):
    try:
        res = await targets_collection.delete_one({"_id": ObjectId(target_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Target not found")
        return {"status": "success", "message": "Target deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/admin/targets")
async def get_sales_targets_and_comparison(admin: dict = Depends(get_admin_user)):
    targets_cursor = targets_collection.find({})
    targets_list = await targets_cursor.to_list(length=None)
    
    orders_cursor = orders_collection.find({})
    orders_list = await orders_cursor.to_list(length=None)
    
    parsed_orders = []
    for order in orders_list:
        created_at = order.get("created_at")
        if not created_at:
            continue
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                continue
        try:
            total = float(order.get("grandTotal", 0.0))
        except (ValueError, TypeError):
            total = 0.0
        parsed_orders.append((created_at, total))
        
    serialized_targets = []
    for t in targets_list:
        name = t.get("name", "Unnamed Target")
        start_str = t.get("start_date")
        end_str = t.get("end_date")
        target_val = float(t.get("target", 0.0))
        
        try:
            start_dt = datetime.strptime(start_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end_dt = datetime.combine(datetime.strptime(end_str, "%Y-%m-%d"), time(23, 59, 59, 999999)).replace(tzinfo=timezone.utc)
        except Exception:
            start_dt = None
            end_dt = None
            
        actual_sales = 0.0
        if start_dt and end_dt:
            for order_dt, total in parsed_orders:
                if order_dt.tzinfo is None:
                    order_dt = order_dt.replace(tzinfo=timezone.utc)
                if start_dt <= order_dt <= end_dt:
                    actual_sales += total
                    
        diff = actual_sales - target_val
        pct = (actual_sales / target_val * 100) if target_val > 0 else 0.0
        
        serialized_targets.append({
            "id": str(t.get("_id")),
            "name": name,
            "start_date": start_str,
            "end_date": end_str,
            "target": target_val,
            "actual_sales": actual_sales,
            "difference": diff,
            "percentage": pct
        })
        
    return {
        "targets": serialized_targets,
        "comparison": [],
        "yearly_comparison": []
    }
