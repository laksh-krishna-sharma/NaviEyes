# app/modules/db.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

DB_URI = os.getenv("DB_URI")
if not DB_URI:
    raise ValueError("DB_URI environment variable is not set.")

# Create an async client and get a reference to your database.
client = AsyncIOMotorClient(DB_URI)
db = client.get_default_database()  # Uses the database specified in the URI, or you can specify one: client["my_database"]

# Optionally, you can create helper functions to return collections:
def get_collection(collection_name: str):
    return db[collection_name]
