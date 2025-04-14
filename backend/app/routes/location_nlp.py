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

    Args:
        lat: Latitude of user's location
        lon: Longitude of user's location
        audio_query: Optional audio bytes for speech query
    """
    try:
        # Flow 1: Get nearby locations based on coordinates
        nearby_locations = await get_location_info(lat, lon)
        
        # If it's a string (like JSON), convert it to list of dicts
        if isinstance(nearby_locations, str):
            nearby_locations = json.loads(nearby_locations)

        location_response = f"Nearby locations include: {', '.join([loc['name'] for loc in nearby_locations])}"

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
        raise HTTPException(status_code=500, detail=str(e))
    