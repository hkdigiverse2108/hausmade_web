from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.models import CouponModel
from app.database.connection import coupons_collection
from app.dependencies.auth_deps import get_admin_user

router = APIRouter(tags=["Coupons"])

@router.get("/api/admin/coupons")
async def get_admin_coupons(admin: dict = Depends(get_admin_user)):
    try:
        coupons = await coupons_collection.find({}).to_list(length=None)
        for c in coupons:
            if "_id" in c:
                c["_id"] = str(c["_id"])
        return coupons
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/coupons/active")
async def get_active_coupons():
    try:
        all_active = await coupons_collection.find({"active": True}).to_list(length=None)
        valid_coupons = []
        now = datetime.now()
        for coupon in all_active:
            if not coupon.get("lifetime", True):
                start_date_str = coupon.get("start_date")
                end_date_str = coupon.get("end_date")
                
                if start_date_str:
                    try:
                        start_dt = datetime.fromisoformat(start_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
                        if now < start_dt:
                            continue
                    except ValueError:
                        pass
                if end_date_str:
                    try:
                        end_dt = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
                        if now > end_dt:
                            continue
                    except ValueError:
                        pass
            
            valid_coupons.append({
                "code": coupon["code"],
                "discount": coupon["discount"],
                "description": coupon.get("description", "")
            })
        return valid_coupons
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/coupons/validate")
async def validate_coupon(code: str):
    try:
        coupon = await coupons_collection.find_one({"code": code.upper(), "active": True})
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid or inactive coupon code")
            
        # Date validity check
        if not coupon.get("lifetime", True):
            now = datetime.now()
            
            start_date_str = coupon.get("start_date")
            end_date_str = coupon.get("end_date")
            
            if start_date_str:
                try:
                    start_dt = datetime.fromisoformat(start_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
                    if now < start_dt:
                        raise HTTPException(status_code=400, detail="This coupon offer has not started yet")
                except ValueError:
                    pass
                    
            if end_date_str:
                try:
                    end_dt = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")).replace(tzinfo=None)
                    if now > end_dt:
                        raise HTTPException(status_code=400, detail="This coupon offer has expired")
                except ValueError:
                    pass

        return {
            "code": coupon["code"],
            "discount": coupon["discount"],
            "description": coupon.get("description", "")
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/admin/coupons")
async def create_coupon(coupon: CouponModel, admin: dict = Depends(get_admin_user)):
    try:
        existing = await coupons_collection.find_one({"code": coupon.code.upper()})
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
            
        doc = coupon.dict()
        doc["code"] = doc["code"].upper()
        await coupons_collection.insert_one(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/admin/coupons/{code}")
async def update_coupon(code: str, coupon: CouponModel, admin: dict = Depends(get_admin_user)):
    try:
        existing = await coupons_collection.find_one({"code": code.upper()})
        if not existing:
            raise HTTPException(status_code=404, detail="Coupon not found")
            
        doc = coupon.dict()
        doc["code"] = doc["code"].upper()
        await coupons_collection.update_one({"code": code.upper()}, {"$set": doc})
        return {"status": "success", "coupon": doc}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/admin/coupons/{code}")
async def delete_coupon(code: str, admin: dict = Depends(get_admin_user)):
    try:
        existing = await coupons_collection.find_one({"code": code.upper()})
        if not existing:
            raise HTTPException(status_code=404, detail="Coupon not found")
            
        await coupons_collection.delete_one({"code": code.upper()})
        return {"status": "success", "message": "Coupon deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
