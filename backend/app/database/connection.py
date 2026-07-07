import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD
from app.security.auth import hash_password

class AsyncCollectionProxy:
    def __init__(self, collection_name):
        self.collection_name = collection_name

    def _get_target(self):
        if motor_db is None:
            raise RuntimeError(f"MongoDB not initialized yet. Cannot access collection '{self.collection_name}'.")
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
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
    client.admin.command('ping')
    client.close()

async def initialize_db():
    global motor_client, motor_db
    print("Connecting to MongoDB Atlas...")
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI environment variable is missing.")
    # Run the synchronous ping check in a separate thread to prevent blocking the event loop
    await asyncio.to_thread(check_mongodb_connection, MONGODB_URI)
    
    motor_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    db_name = MONGODB_URI.split('/')[-1].split('?')[0]
    if not db_name or db_name == "localhost:27017" or db_name.strip() == "":
        db_name = "soap_db"
        
    motor_db = motor_client[db_name]
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
