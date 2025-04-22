import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

DB_URI = os.getenv("DB_URI")
if not DB_URI:
    raise ValueError("DB_URI environment variable is not set.")

# Create an async client and get a reference to your database.
client = AsyncIOMotorClient(DB_URI)
db = client.get_default_database()  

def get_collection(collection_name: str):
    return db[collection_name]