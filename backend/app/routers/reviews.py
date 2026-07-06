import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.schemas.models import ReviewSubmitModel, ReviewUpdateModel
from app.database.connection import reviews_collection, users_collection, orders_collection
from app.dependencies.auth_deps import get_current_user_email, get_admin_user

router = APIRouter(tags=["Reviews"])

@router.post("/api/reviews")
async def submit_review(review: ReviewSubmitModel, current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication token required to write a review")
        
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email.lower()},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
        
    orders = await orders_collection.find({"user_email": current_user_email}).to_list(length=None)
    has_delivered_order = False
    for order in orders:
        if order.get("status") == "delivered":
            for item in order.get("cartItems", []):
                if item.get("packId") == review.productId:
                    has_delivered_order = True
                    break
        if has_delivered_order:
            break
            
    if not has_delivered_order:
        raise HTTPException(
            status_code=400,
            detail="You can only review products that have been delivered to you."
        )
        
    review_doc = {
        "id": str(uuid.uuid4()),
        "productId": review.productId,
        "productTitle": review.productTitle,
        "userName": user.get("name", "Verified Customer"),
        "userEmail": current_user_email,
        "rating": review.rating,
        "comment": review.comment,
        "approved": False,
        "created_at": datetime.utcnow()
    }
    
    await reviews_collection.insert_one(review_doc)
    if "_id" in review_doc:
        review_doc["_id"] = str(review_doc["_id"])
        
    return {"status": "success", "review": review_doc}

@router.get("/api/reviews")
async def get_approved_reviews():
    try:
        reviews = await reviews_collection.find({"approved": True}).to_list(length=None)
        for r in reviews:
            if "_id" in r:
                r["_id"] = str(r["_id"])
            if "created_at" in r and isinstance(r["created_at"], datetime):
                r["created_at"] = r["created_at"].isoformat()
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/admin/reviews")
async def get_all_reviews_admin(admin: dict = Depends(get_admin_user)):
    try:
        reviews = await reviews_collection.find({}).to_list(length=None)
        for r in reviews:
            if "_id" in r:
                r["_id"] = str(r["_id"])
            if "created_at" in r and isinstance(r["created_at"], datetime):
                r["created_at"] = r["created_at"].isoformat()
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/admin/reviews/{id}/approve")
async def approve_review(id: str, admin: dict = Depends(get_admin_user)):
    try:
        query = {"id": id}
        existing = await reviews_collection.find_one(query)
        if not existing:
            try:
                query = {"_id": ObjectId(id)}
                existing = await reviews_collection.find_one(query)
            except Exception:
                query = {"_id": id}
                existing = await reviews_collection.find_one(query)
                
        if not existing:
            raise HTTPException(status_code=404, detail="Review not found")
            
        await reviews_collection.update_one(query, {"$set": {"approved": True}})
        return {"status": "success", "message": "Review approved successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/admin/reviews/{id}")
async def delete_review(id: str, admin: dict = Depends(get_admin_user)):
    try:
        query = {"id": id}
        existing = await reviews_collection.find_one(query)
        if not existing:
            try:
                query = {"_id": ObjectId(id)}
                existing = await reviews_collection.find_one(query)
            except Exception:
                query = {"_id": id}
                existing = await reviews_collection.find_one(query)
                
        if not existing:
            raise HTTPException(status_code=404, detail="Review not found")
            
        await reviews_collection.delete_one(query)
        return {"status": "success", "message": "Review deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel, Field

class AdminReviewUpdateModel(BaseModel):
    productId: str
    productTitle: str
    userName: str
    userEmail: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

@router.put("/api/admin/reviews/{id}")
async def update_review(id: str, review: AdminReviewUpdateModel, admin: dict = Depends(get_admin_user)):
    try:
        query = {"id": id}
        existing = await reviews_collection.find_one(query)
        if not existing:
            try:
                query = {"_id": ObjectId(id)}
                existing = await reviews_collection.find_one(query)
            except Exception:
                query = {"_id": id}
                existing = await reviews_collection.find_one(query)
                
        if not existing:
            raise HTTPException(status_code=404, detail="Review not found")
            
        await reviews_collection.update_one(query, {"$set": {
            "productId": review.productId,
            "productTitle": review.productTitle,
            "userName": review.userName,
            "userEmail": review.userEmail,
            "rating": review.rating,
            "comment": review.comment
        }})
        return {"status": "success", "message": "Review updated successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel, Field

class AdminReviewCreateModel(BaseModel):
    productId: str
    productTitle: str
    userName: str
    userEmail: str
    rating: int = Field(..., ge=1, le=5)
    comment: str
    approved: bool = True

@router.post("/api/admin/reviews")
async def admin_create_review(review: AdminReviewCreateModel, admin: dict = Depends(get_admin_user)):
    try:
        review_doc = {
            "id": str(uuid.uuid4()),
            "productId": review.productId,
            "productTitle": review.productTitle,
            "userName": review.userName,
            "userEmail": review.userEmail,
            "rating": review.rating,
            "comment": review.comment,
            "approved": review.approved,
            "created_at": datetime.utcnow()
        }
        await reviews_collection.insert_one(review_doc)
        if "_id" in review_doc:
            review_doc["_id"] = str(review_doc["_id"])
        return {"status": "success", "review": review_doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

