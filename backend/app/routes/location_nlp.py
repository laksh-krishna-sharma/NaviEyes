"""
use location module to get location store nearby location
use stt module to convert speech to text
use nlp module to get nlp reasoning
use tts module to convert text to speech

1) lon lat => user location ---- sst => prompt => nlp reasoning => response(asked nearby locaton) => tts

2) query ---- sst => prompt => nlp reasoning => response => tts
"""

from fastapi import APIRouter, HTTPException
from app.modules.location_lookup import get_location_info
from app.modules.stt_module import speech_to_text
from app.modules.nlp import run_nlp_reasoning
from app.modules.tts_module import text_to_speech
from typing import Optional
import json

router = APIRouter()

@router.post("/location_query")
async def handle_location_query(lat: float, lon: float, audio_query: Optional[bytes] = None):
    """
    Endpoint to handle location-based queries with two flows:
    1) Use lat/lon to get nearby locations and respond via TTS
    2) Process a query through STT -> NLP -> TTS pipeline
    """
    try:
        # Flow 1: Get nearby locations based on coordinates
        nearby_data = await get_location_info(lat, lon)
        
        # If it's a string (like JSON), convert it to a dict
        if isinstance(nearby_data, str):
            nearby_data = json.loads(nearby_data)
            
        # Handle the dictionary structure - it might have a key containing the actual locations
        nearby_locations = []
        
        # Check if the data has a standard format like {"locations": [...]} or {"results": [...]}
        if "locations" in nearby_data and isinstance(nearby_data["locations"], list):
            nearby_locations = nearby_data["locations"]
        elif "results" in nearby_data and isinstance(nearby_data["results"], list):
            nearby_locations = nearby_data["results"]
        elif "places" in nearby_data and isinstance(nearby_data["places"], list):
            nearby_locations = nearby_data["places"]
        # If it's a flat dictionary with location fields directly
        elif "name" in nearby_data:
            nearby_locations = [nearby_data]
        else:
            # As a last resort, try to find any list in the dictionary
            for key, value in nearby_data.items():
                if isinstance(value, list) and len(value) > 0:
                    nearby_locations = value
                    break
            
        if not nearby_locations:
            # No locations found, return a message
            location_response = "No nearby locations found."
            nearby_locations = []
        else:
            # Extract location names safely
            location_names = []
            for loc in nearby_locations:
                if isinstance(loc, dict) and 'name' in loc:
                    location_names.append(loc['name'])
                elif isinstance(loc, str):
                    location_names.append(loc)
                    
            if location_names:
                location_response = f"Nearby locations include: {', '.join(location_names)}"
            else:
                location_response = "Found nearby locations but couldn't extract names."
                
        # Flow 2: If audio query exists
        if audio_query:
            # Convert speech to text
            query_text = speech_to_text(audio_query)
            
            # Get NLP response
            nlp_response = run_nlp_reasoning(query_text)
            
            # Combine responses
            full_response = f"{nlp_response}. Also, {location_response}"
            
            # Convert to speech
            tts_audio = text_to_speech(full_response)
            
            return {
                "text_response": full_response,
                "audio_response": tts_audio,
                "nearby_locations": nearby_locations
            }

        # If no audio query, just return location info
        tts_audio = text_to_speech(location_response)
        return {
            "text_response": location_response,
            "audio_response": tts_audio,
            "nearby_locations": nearby_locations
        }

    except Exception as e:
        # Include more debug info in the error
        error_message = f"{str(e)}"
        if 'nearby_data' in locals():
            error_message += f" - Data structure: {type(nearby_data)}"
            if isinstance(nearby_data, dict):
                error_message += f" with keys: {list(nearby_data.keys())}"
                
        raise HTTPException(status_code=500, detail=error_message)