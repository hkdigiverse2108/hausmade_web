import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
from app.security.auth import hash_password

import json
import os
from bson import ObjectId

USE_JSON_FALLBACK = False
JSON_DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class AsyncCollectionProxy:
    def __init__(self, collection_name):
        self.collection_name = collection_name

    def _get_target(self):
        if motor_db is None:
            raise RuntimeError(f"MongoDB not initialized yet. Cannot access collection '{self.collection_name}'.")
        return motor_db[self.collection_name]

    async def find_one(self, filter={}, *args, **kwargs):
        target = self._get_target()
        return await target.find_one(filter, *args, **kwargs)

    async def insert_one(self, document, *args, **kwargs):
        target = self._get_target()
        return await target.insert_one(document, *args, **kwargs)

    async def update_one(self, filter, update, *args, **kwargs):
        target = self._get_target()
        return await target.update_one(filter, update, *args, **kwargs)

    async def delete_one(self, filter, *args, **kwargs):
        target = self._get_target()
        return await target.delete_one(filter, *args, **kwargs)

    def find(self, filter={}, *args, **kwargs):
        target = self._get_target()
        return target.find(filter, *args, **kwargs)

# Global clients/dbs
motor_client = None
motor_db = None

# Initialize collections
users_collection = AsyncCollectionProxy("users")
orders_collection = AsyncCollectionProxy("orders")
otps_collection = AsyncCollectionProxy("otps")
products_collection = AsyncCollectionProxy("products")
coupons_collection = AsyncCollectionProxy("coupons")
settings_collection = AsyncCollectionProxy("settings")
reviews_collection = AsyncCollectionProxy("reviews")
subscriptions_collection = AsyncCollectionProxy("subscriptions")

def check_mongodb_connection(uri):
    if not uri:
        raise ValueError("MongoDB URI is not configured.")
    import pymongo
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    client.admin.command('ping')
    client.close()

async def migrate_json_to_mongodb():
    collections_to_migrate = ["users", "orders", "otps", "products", "coupons", "settings", "reviews", "subscriptions"]
    for coll_name in collections_to_migrate:
        try:
            coll = motor_db[coll_name]
            count = await coll.count_documents({})
            if count == 0:
                json_path = os.path.join(JSON_DB_DIR, f"{coll_name}.json")
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        content = f.read().strip()
                        if content:
                            data = json.loads(content)
                            if isinstance(data, dict):
                                data = [data]
                            if isinstance(data, list) and len(data) > 0:
                                for doc in data:
                                    if "_id" in doc:
                                        if isinstance(doc["_id"], str) and len(doc["_id"]) == 24:
                                            try:
                                                doc["_id"] = ObjectId(doc["_id"])
                                            except Exception:
                                                pass
                                    for key in ["created_at", "updated_at"]:
                                        if key in doc and isinstance(doc[key], str):
                                            try:
                                                doc[key] = datetime.fromisoformat(doc[key].replace("Z", "+00:00"))
                                            except ValueError:
                                                try:
                                                    doc[key] = datetime.strptime(doc[key], "%Y-%m-%d %H:%M:%S.%f")
                                                except ValueError:
                                                    try:
                                                        doc[key] = datetime.strptime(doc[key], "%Y-%m-%d %H:%M:%S")
                                                    except ValueError:
                                                        pass
                                await coll.insert_many(data)
                                print(f"[MIGRATION] Successfully migrated {len(data)} documents to MongoDB collection '{coll_name}'")
        except Exception as e:
            print(f"[MIGRATION] Error migrating collection '{coll_name}': {e}")

async def initialize_db():
    global motor_client, motor_db, USE_JSON_FALLBACK
    print("Connecting to MongoDB Atlas...")
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI environment variable is missing.")
    
    # Run the synchronous ping check in a separate thread to prevent blocking the event loop
    await asyncio.to_thread(check_mongodb_connection, MONGODB_URI)
    
    motor_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    db_name = MONGODB_URI.split('/')[-1].split('?')[0]
    if not db_name or db_name == "localhost:27017" or db_name.strip() == "":
        db_name = "soap_db"
        
    motor_db = motor_client[db_name]
    print(f"Successfully connected to MongoDB Database: {db_name}")
    
    # Migrate any existing JSON fallback data to MongoDB
    await migrate_json_to_mongodb()
    
    # Initialize indexes on startup
    print("Initializing MongoDB Indexes...")
    try:
        await motor_db["users"].create_index("email", unique=True, sparse=True)
        await motor_db["users"].create_index("mobile", unique=True, sparse=True)
        await motor_db["users"].create_index("auth0_sub", unique=True, sparse=True)
        await motor_db["orders"].create_index("orderId", unique=True)
        await motor_db["orders"].create_index([("user_email", 1), ("created_at", -1)])
        await motor_db["products"].create_index("id", unique=True)
        await motor_db["coupons"].create_index("code", unique=True)
        await motor_db["reviews"].create_index([("productId", 1), ("created_at", -1)])
        await motor_db["subscriptions"].create_index("subscriptionId", unique=True)
        await motor_db["otps"].create_index("mobile", unique=True)
        await motor_db["otps"].create_index("created_at", expireAfterSeconds=300)
        print("MongoDB Indexes initialized successfully.")
    except Exception as idx_err:
        print(f"Failed to initialize MongoDB Indexes: {idx_err}")

async def seed_admin_and_data_func():
    existing = await users_collection.find_one({"email": ADMIN_EMAIL})
    if not existing:
        hashed_pwd = hash_password(ADMIN_PASSWORD)
        admin_doc = {
            "name": "Hausmade Owner",
            "email": ADMIN_EMAIL,
            "mobile": "9999999999",
            "password": hashed_pwd,
            "is_admin": True,
            "created_at": datetime.utcnow()
        }
        await users_collection.insert_one(admin_doc)
        print(f"\n[SEED] Default admin user seeded successfully: {ADMIN_EMAIL}\n")

    # Seed products if empty
    try:
        prod_count = len(await products_collection.find({}).to_list(length=None))
    except Exception:
        prod_count = 0
    if prod_count == 0:
        DEFAULT_PRODUCTS = [
            {
                "id": "single",
                "title": "Single Soap Bar (75g)",
                "count": 1,
                "basePrice": 299.00,
                "savingsBadge": None,
                "popular": False,
                "bestValue": False,
                "image": "/images/pack-single.png",
                "stock": 100
            },
            {
                "id": "pack-2",
                "title": "Pack of 2",
                "count": 2,
                "basePrice": 538.00,
                "savingsBadge": "Save 10%",
                "popular": False,
                "bestValue": False,
                "image": "/images/pack-2.png",
                "stock": 100
            },
            {
                "id": "pack-3",
                "title": "Pack of 3",
                "count": 3,
                "basePrice": 717.00,
                "savingsBadge": "Save 20%",
                "popular": True,
                "bestValue": False,
                "image": "/images/pack-3.png",
                "stock": 100
            },
            {
                "id": "pack-5",
                "title": "Pack of 5",
                "count": 5,
                "basePrice": 1046.00,
                "savingsBadge": "Save 30%",
                "popular": False,
                "bestValue": True,
                "image": "/images/pack-5.png",
                "stock": 100
            }
        ]
        for p in DEFAULT_PRODUCTS:
            await products_collection.insert_one(p)
        print(f"\n[SEED] Default products seeded successfully.\n")

    # No automatic coupon seeding to support full admin panel manual coupon management.
    pass
