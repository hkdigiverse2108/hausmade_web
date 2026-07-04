import os
from datetime import datetime, timedelta
from fastapi import HTTPException
import bcrypt
import jwt
from jwt import PyJWKClient
from app.config.settings import (
    JWT_SECRET,
    ALGORITHM,
    AUTH0_DOMAIN,
    AUTH0_AUDIENCE,
    ENV
)

# Initialize JWK Client
jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
jwk_client = None
if "dev-your-domain" not in AUTH0_DOMAIN:
    try:
        jwk_client = PyJWKClient(jwks_url)
    except Exception as e:
        print(f"Failed to initialize Auth0 JWK Client: {e}")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def verify_auth0_token(token: str) -> dict:
    if ENV == "production":
        # Block simulated tokens or signature bypass in production environments
        if not jwk_client:
            raise HTTPException(status_code=500, detail="JWK Client is not configured in production")
    else:
        if "dev-your-domain" in AUTH0_DOMAIN or not jwk_client:
            if token == "mock_google_jwt_token":
                return {
                    "sub": "google-oauth2|mock-google-sub-12345",
                    "email": "google.mock@example.com",
                    "name": "Google User (Mock)"
                }
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Invalid simulated token: {e}")

    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def create_jwt_token(sub: str) -> str:
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": sub,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
