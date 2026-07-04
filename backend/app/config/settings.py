import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

PORT_FRONTEND = os.getenv("PORT_FRONTEND", "5173")
PORT_BACKEND = os.getenv("PORT_BACKEND", "8005")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/soap_db")
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_hausmade_key_12345")
ALGORITHM = "HS256"
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-your-domain.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", f"http://localhost:{PORT_BACKEND}")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

ENV = os.getenv("ENV", "development")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if not ADMIN_EMAIL or not ADMIN_PASSWORD:
    # Ensure variables exist, fallback to warning or defaults ONLY if local dev setting
    if os.getenv("ENV") == "production":
        raise ValueError("Production Error: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables!")
    else:
        # Development defaults if not specified
        ADMIN_EMAIL = ADMIN_EMAIL or "admin@hausmade.com"
        ADMIN_PASSWORD = ADMIN_PASSWORD or "adminsecret"

