import os
import sys

# Add the parent directory of 'app' to sys.path to resolve imports correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from datetime import datetime
from collections import defaultdict
from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv, find_dotenv

from .config.settings import (
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    PORT_FRONTEND,
    PORT_BACKEND
)
from .database.connection import initialize_db, seed_admin_and_data_func
from .routers import auth, products, orders, coupons, settings, reviews, users, subscriptions

load_dotenv(find_dotenv())

# Cloudinary configuration
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

app = FastAPI(title="Hausmade™ Soap Backend", version="1.0.0")

# Simple In-Memory Rate Limiter for Sensitive Endpoints (no Redis dependency)
class InMemoryRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.client_records = defaultdict(list)

    def is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        # Clean up timestamps older than the window
        self.client_records[client_ip] = [
            t for t in self.client_records[client_ip] if now - t < self.window_seconds
        ]
        if len(self.client_records[client_ip]) >= self.requests_limit:
            return True
        self.client_records[client_ip].append(now)
        return False

# Limit sensitive paths to 5 requests per 60 seconds
sensitive_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    sensitive_paths = ["/api/auth/login", "/api/auth/register", "/api/auth/send-otp", "/api/orders", "/api/coupons/validate"]
    if request.url.path in sensitive_paths:
        client_ip = request.client.host if request.client else "unknown"
        if sensitive_limiter.is_rate_limited(client_ip):
            print(f"[SECURITY WARNING] Rate limit triggered for IP: {client_ip} on path: {request.url.path}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again in a minute."}
            )
    return await call_next(request)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://res.cloudinary.com;"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

@app.on_event("startup")
async def startup_event():
    # Asynchronously initialize connection pool
    await initialize_db()
    # Seed default collections
    await seed_admin_and_data_func()

# Allow requests from the React frontend development server dynamically
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        f"http://localhost:{PORT_FRONTEND}",
        f"http://127.0.0.1:{PORT_FRONTEND}",
        f"http://localhost:{PORT_BACKEND}",
        f"http://127.0.0.1:{PORT_BACKEND}"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose image upload directly
@app.post("/api/upload")
def upload_image(file: UploadFile = File(...)):
    try:
        result = cloudinary.uploader.upload(file.file)
        return {"url": result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/ready")
def readiness_probe():
    # Confirm backend ready to accept traffic
    return {"status": "ready"}

@app.get("/live")
def liveness_probe():
    # Confirm app process is alive
    return {"status": "alive"}

# Include modular routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(coupons.router)
app.include_router(settings.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(subscriptions.router)
