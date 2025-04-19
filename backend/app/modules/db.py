from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

uri = os.getenv("DB_URI")
db_name = "visionvoiceDB"  # Explicitly define the database name here

if not uri:
    raise ValueError("DB_URI not found in environment variables")

try:
    client = MongoClient(uri, server_api=ServerApi("1"))
    client.admin.command("ping")
    logger.info("Successfully connected to MongoDB")
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise e

# Specify the database explicitly
db = client[db_name]

def get_collection(collection_name: str):
    return db[collection_name]
