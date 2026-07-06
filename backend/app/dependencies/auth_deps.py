from typing import Optional
from datetime import datetime
from fastapi import Header, HTTPException, Depends, status
import jwt
from app.config.settings import JWT_SECRET, ALGORITHM
from app.database.connection import users_collection
from app.security.auth import verify_auth0_token

async def get_current_user_email(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    try:
        token = authorization.split(" ")[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            return payload.get("sub")
        except jwt.InvalidTokenError:
            payload = verify_auth0_token(token)
            
            email = payload.get("email")
            sub = payload.get("sub")
            name = ""
            
            if sub:
                existing_user = None
                if email:
                    existing_user = await users_collection.find_one({"email": email.lower()})
                
                if existing_user:
                    # Link Auth0 sub to the existing manual account
                    await users_collection.update_one(
                        {"_id": existing_user["_id"]},
                        {
                            "$set": {
                                "auth0_sub": sub,
                                "name": existing_user.get("name") or "",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                else:
                    await users_collection.update_one(
                        {"auth0_sub": sub},
                        {
                            "$set": {
                                "name": "",
                                "email": email or "",
                                "auth0_sub": sub,
                                "updated_at": datetime.utcnow()
                            }
                        },
                        upsert=True
                    )
            
            return email or sub
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

async def get_admin_user(current_user_email: str = Depends(get_current_user_email)):
    if not current_user_email:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = await users_collection.find_one({
        "$or": [
            {"email": current_user_email},
            {"mobile": current_user_email},
            {"auth0_sub": current_user_email}
        ]
    })
    if not user or not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Access denied. Admin privileges required.")
    return user
