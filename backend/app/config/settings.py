import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/soap_db")
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_hausmade_key_12345")
ALGORITHM = "HS256"
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-your-domain.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "http://localhost:8005")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

ENV = os.getenv("ENV", "development")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@hausmade.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminsecret")

