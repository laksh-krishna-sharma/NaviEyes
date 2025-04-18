from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.modules.stt_module import speech_to_text
from app.modules.location_lookup import get_location_info
from app.modules.nlp import run_nlp_reasoning
from app.modules.tts_module import text_to_speech
import tempfile
import os

router = APIRouter()


def process_audio_reasoning(audio_file_path: str, prompt_prefix: str = "") -> dict:
    """
    Handles speech-to-text, reasoning, and TTS. Used by both voice endpoints.
    """
    prompt = speech_to_text(audio_file_path)
    full_prompt = f"{prompt_prefix}{prompt}" if prompt_prefix else prompt

    reasoning_output = run_nlp_reasoning(full_prompt)
    if not reasoning_output["success"]:
        raise HTTPException(status_code=500, detail=reasoning_output["error"])

    final_response = reasoning_output["response"]
    tts_url = text_to_speech(final_response)

    return {
        "query": prompt,
        "response": final_response,
        "tts_audio_url": tts_url
    }


@router.post("/voice-location")
async def voice_with_location(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...)
):
    """
    Accepts a speech audio + coordinates and returns spoken response for nearby place query.
    """
    audio_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await file.read())
            audio_path = temp_audio.name

        location_info = await get_location_info(latitude, longitude)
        address = location_info.get("address", "")

        prefix = f"User is at: {address}\nQuery: "
        result = process_audio_reasoning(audio_path, prompt_prefix=prefix)

        return {
            "location": location_info,
            **result
        }

    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


@router.post("/voice-query")
async def voice_query(file: UploadFile = File(...)):
    """
    Accepts a speech audio and returns a spoken general response.
    """
    audio_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            temp_audio.write(await file.read())
            audio_path = temp_audio.name

        result = process_audio_reasoning(audio_path)

        return result

    finally:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
