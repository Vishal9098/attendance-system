import motor.motor_asyncio
from config import settings

client = None
db = None

async def connect_db():
    global client, db
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.attendance.create_index([("user_id", 1), ("date", 1)])
    print("✅ Connected to MongoDB Atlas")

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")

def get_db():
    return db
