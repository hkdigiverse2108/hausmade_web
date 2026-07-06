import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status
from app.schemas.models import UserRegister, UserLogin, SendOtpRequest, VerifyOtpRequest
from app.database.connection import users_collection, otps_collection
from app.security.auth import hash_password, verify_password, create_jwt_token
from app.security.email_sender import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=201)
async def register(user_data: UserRegister):
    existing_user_email = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email already exists"
        )
        
    mobile_val = user_data.mobile.strip() if user_data.mobile else ""
    if mobile_val:
        existing_user_mobile = await users_collection.find_one({"mobile": mobile_val})
        if existing_user_mobile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account with this mobile number already exists"
            )
    
    hashed_pwd = hash_password(user_data.password)
    user_doc = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "mobile": mobile_val,
        "password": hashed_pwd,
        "created_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(user_doc)
    token = create_jwt_token(user_data.email.lower())
    
    return {
        "token": token,
        "user": {
            "name": user_doc["name"],
            "email": user_doc["email"],
            "mobile": user_doc["mobile"],
            "address_line1": "",
            "address_line2": "",
            "city": "",
            "state": "",
            "zip_code": "",
            "country": "",
            "addresses": [],
            "is_admin": user_doc.get("is_admin", False)
        }
    }

@router.post("/login")
async def login(user_data: UserLogin):
    user = await users_collection.find_one({
        "$or": [
            {"email": user_data.identifier.lower()},
            {"mobile": user_data.identifier}
        ]
    })
    
    if not user or not user.get("password") or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid identifier or password"
        )
    
    token = create_jwt_token(user["email"] or user["mobile"])
    return {
        "token": token,
        "user": {
            "name": user["name"],
            "email": user.get("email", ""),
            "mobile": user.get("mobile", ""),
            "address_line1": user.get("address_line1", ""),
            "address_line2": user.get("address_line2", ""),
            "city": user.get("city", ""),
            "state": user.get("state", ""),
            "zip_code": user.get("zip_code", ""),
            "country": user.get("country", ""),
            "addresses": user.get("addresses", []),
            "is_admin": user.get("is_admin", False)
        }
    }

@router.post("/send-otp")
async def send_otp(request: SendOtpRequest):
    mobile = request.mobile.strip() if request.mobile else None
    email = request.email.strip().lower() if request.email else None
    
    if not mobile and not email:
        raise HTTPException(status_code=400, detail="Mobile number or email is required")
    
    otp = str(random.randint(100000, 999999))
    
    if email:
        await otps_collection.update_one(
            {"email": email},
            {"$set": {"otp": otp, "created_at": datetime.utcnow()}},
            upsert=True
        )
        print(f"\n=======================================================")
        print(f"[OTP SIMULATION] Verification code for email {email} is: {otp}")
        print(f"=======================================================\n")
        await send_otp_email(email, otp)
    else:
        await otps_collection.update_one(
            {"mobile": mobile},
            {"$set": {"otp": otp, "created_at": datetime.utcnow()}},
            upsert=True
        )
        print(f"\n=======================================================")
        print(f"[OTP SIMULATION] Verification code for mobile {mobile} is: {otp}")
        print(f"=======================================================\n")
    
    return {"status": "success", "message": "OTP sent successfully (Simulated)"}

@router.post("/verify-otp")
async def verify_otp(request: VerifyOtpRequest):
    mobile = request.mobile.strip() if request.mobile else None
    email = request.email.strip().lower() if request.email else None
    otp = request.otp.strip()
    
    if not mobile and not email:
        raise HTTPException(status_code=400, detail="Mobile number or email is required")
        
    if email:
        record = await otps_collection.find_one({"email": email})
        if not record or record.get("otp") != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP code")
            
        if datetime.utcnow() - record.get("created_at") > timedelta(minutes=5):
            raise HTTPException(status_code=400, detail="OTP code has expired")
            
        user = await users_collection.find_one({"email": email})
        if not user:
            user_doc = {
                "name": f"Member {email.split('@')[0]}",
                "email": email,
                "mobile": "",
                "password": "",
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(user_doc)
            user = user_doc
            
        token = create_jwt_token(email)
        await otps_collection.delete_one({"email": email})
    else:
        record = await otps_collection.find_one({"mobile": mobile})
        if not record or record.get("otp") != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP code")
            
        if datetime.utcnow() - record.get("created_at") > timedelta(minutes=5):
            raise HTTPException(status_code=400, detail="OTP code has expired")
            
        user = await users_collection.find_one({"mobile": mobile})
        if not user:
            user_doc = {
                "name": f"Member {mobile[-4:]}",
                "email": "",
                "mobile": mobile,
                "password": "",
                "created_at": datetime.utcnow()
            }
            await users_collection.insert_one(user_doc)
            user = user_doc
            
        token = create_jwt_token(mobile)
        await otps_collection.delete_one({"mobile": mobile})
        
    return {
        "token": token,
        "user": {
            "name": user["name"],
            "email": user.get("email", ""),
            "mobile": user.get("mobile", ""),
            "address_line1": user.get("address_line1", ""),
            "address_line2": user.get("address_line2", ""),
            "city": user.get("city", ""),
            "state": user.get("state", ""),
            "zip_code": user.get("zip_code", ""),
            "country": user.get("country", ""),
            "addresses": user.get("addresses", []),
            "is_admin": user.get("is_admin", False)
        }
    }
