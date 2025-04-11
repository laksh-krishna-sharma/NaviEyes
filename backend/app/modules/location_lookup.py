import os
import logging
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderServiceError
from fastapi import HTTPException
from datetime import datetime
from app.modules.db import get_collection

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

geolocator = Nominatim(user_agent="visionvoice-location")

async def get_location_info(latitude: float, longitude: float) -> dict:
    """
    Reverse geocode coordinates to get human-readable location information.
    """
    try:
        location = geolocator.reverse((latitude, longitude), exactly_one=True, language='en')
        if location:
            address = location.raw.get("display_name", "Unknown location")
        else:
            raise HTTPException(status_code=404, detail="Location not found")
    except GeocoderServiceError as e:
        logger.error(f"Geocoder error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching location")

    log_data = {
        "latitude": latitude,
        "longitude": longitude,
        "address": address,
        "timestamp": datetime.utcnow()
    }

    try:
        logs_collection = get_collection("location_logs")
        await logs_collection.insert_one(log_data)
    except Exception as e:
        logger.error(f"Error logging location lookup to MongoDB: {e}")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "address": address
    }
