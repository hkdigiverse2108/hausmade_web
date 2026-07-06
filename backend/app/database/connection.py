import os
import json
import uuid
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
from app.security.auth import hash_password

use_local_json = False

class AsyncJSONCursor:
    def __init__(self, collection, query):
        self.collection = collection
        self.query = query

    async def to_list(self, length=None):
        data = self.collection._read()
        results = []
        for doc in data:
            if self.collection._matches(doc, self.query):
                if "_id" in doc and not isinstance(doc["_id"], str):
                    doc["_id"] = str(doc["_id"])
                results.append(doc)
        if length is not None:
            return results[:length]
        return results

class AsyncJSONCollection:
    def __init__(self, filename: str):
        self.filename = filename
        if not os.path.exists(self.filename):
            with open(self.filename, 'w') as f:
                json.dump([], f)
                
    def _read(self):
        try:
            if not os.path.exists(self.filename):
                return []
            with open(self.filename, 'r') as f:
                return json.load(f)
        except Exception:
            return []
            
    def _write(self, data):
        with open(self.filename, 'w') as f:
            json.dump(data, f, default=str)

    async def find_one(self, query):
        data = self._read()
        for doc in data:
            if self._matches(doc, query):
                if "_id" in doc and not isinstance(doc["_id"], str):
                    doc["_id"] = str(doc["_id"])
                return doc
        return None

    async def insert_one(self, doc):
        data = self._read()
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        data.append(doc)
        self._write(data)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def update_one(self, query, update, upsert=False):
        data = self._read()
        matched = False
        
        set_data = update.get("$set", {}) if isinstance(update, dict) and "$set" in update else update
        if not isinstance(set_data, dict):
            set_data = {}
        
        for doc in data:
            if self._matches(doc, query):
                doc.update(set_data)
                matched = True
                break
                
        if not matched and upsert:
            new_doc = {}
            if isinstance(query, dict):
                # Only copy simple key-value pairs from query (not operators)
                for k, v in query.items():
                    if not k.startswith("$"):
                        new_doc[k] = v
            # Apply $setOnInsert fields first (only on new documents)
            set_on_insert = update.get("$setOnInsert", {}) if isinstance(update, dict) else {}
            if set_on_insert:
                new_doc.update(set_on_insert)
            # Then apply $set fields (overrides $setOnInsert if overlapping)
            new_doc.update(set_data)
            await self.insert_one(new_doc)
        else:
            self._write(data)

    async def delete_one(self, query):
        data = self._read()
        new_data = [doc for doc in data if not self._matches(doc, query)]
        self._write(new_data)

    def find(self, query=None):
        return AsyncJSONCursor(self, query or {})

    def _matches(self, doc, query):
        if not query:
            return True
        if not isinstance(query, dict):
            return False
            
        if "$or" in query:
            for sub_query in query["$or"]:
                if self._matches(doc, sub_query):
                    return True
            return False
            
        for key, value in query.items():
            if doc.get(key) != value:
                return False
        return True

class AsyncCollectionProxy:
    def __init__(self, collection_name, json_filename):
        self.collection_name = collection_name
        self.json_filename = json_filename
        self._json_collection = AsyncJSONCollection(json_filename)

    def _get_target(self):
        if use_local_json:
            return self._json_collection
        return motor_db[self.collection_name]

    async def find_one(self, *args, **kwargs):
        target = self._get_target()
        return await target.find_one(*args, **kwargs)

    async def insert_one(self, *args, **kwargs):
        target = self._get_target()
        return await target.insert_one(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        target = self._get_target()
        return await target.update_one(*args, **kwargs)

    async def delete_one(self, *args, **kwargs):
        target = self._get_target()
        return await target.delete_one(*args, **kwargs)

    def find(self, *args, **kwargs):
        target = self._get_target()
        return target.find(*args, **kwargs)

# Global clients/dbs
motor_client = None
motor_db = None

# Initialize collections
users_collection = AsyncCollectionProxy("users", "users.json")
orders_collection = AsyncCollectionProxy("orders", "orders.json")
otps_collection = AsyncCollectionProxy("otps", "otps.json")
products_collection = AsyncCollectionProxy("products", "products.json")
coupons_collection = AsyncCollectionProxy("coupons", "coupons.json")
settings_collection = AsyncCollectionProxy("settings", "settings.json")
reviews_collection = AsyncCollectionProxy("reviews", "reviews.json")
subscriptions_collection = AsyncCollectionProxy("subscriptions", "subscriptions.json")

async def initialize_db():
    global motor_client, motor_db, use_local_json
    print("Connecting to MongoDB Atlas...")
    try:
        motor_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
        await motor_client.admin.command('ping')
        
        db_name = MONGODB_URI.split('/')[-1].split('?')[0]
        if not db_name or db_name == "localhost:27017" or db_name.strip() == "":
            db_name = "soap_db"
            
        motor_db = motor_client[db_name]
        use_local_json = False
        print(f"Successfully connected to MongoDB Database: {db_name}")
        
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
            
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("Falling back to local JSON file database for offline/local development.")
        use_local_json = True

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
