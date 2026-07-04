from fastapi import APIRouter, HTTPException, Depends
from app.schemas.models import ProductModel
from app.database.connection import products_collection
from app.dependencies.auth_deps import get_admin_user

router = APIRouter(tags=["Products"])

@router.get("/api/products")
async def get_products():
    try:
        prods = await products_collection.find({}).to_list(length=None)
        for p in prods:
            if "_id" in p:
                p["_id"] = str(p["_id"])
        return prods
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/admin/products")
async def create_product(product: ProductModel, admin: dict = Depends(get_admin_user)):
    try:
        existing = await products_collection.find_one({"id": product.id})
        if existing:
            raise HTTPException(status_code=400, detail="Product ID already exists")
        
        doc = product.dict()
        await products_collection.insert_one(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/admin/products/{id}")
async def update_product(id: str, product: ProductModel, admin: dict = Depends(get_admin_user)):
    try:
        existing = await products_collection.find_one({"id": id})
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
            
        doc = product.dict()
        await products_collection.update_one({"id": id}, {"$set": doc})
        return {"status": "success", "product": doc}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/admin/products/{id}")
async def delete_product(id: str, admin: dict = Depends(get_admin_user)):
    try:
        existing = await products_collection.find_one({"id": id})
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
            
        await products_collection.delete_one({"id": id})
        return {"status": "success", "message": "Product deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
