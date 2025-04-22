from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from app.modules.stt_module import speech_to_text
from app.modules.tts_module import text_to_speech
from app.modules.nlp import run_nlp_reasoning
import tempfile
import os

router = APIRouter()

async def process_audio_reasoning(audio_file_path: str) -> str:
    prompt = speech_to_text(audio_file_path)
    reasoning = run_nlp_reasoning(prompt)
    if not reasoning["success"]:
        raise HTTPException(status_code=500, detail=reasoning["error"])
    response_text = reasoning["response"]
    wav_path = text_to_speech(response_text)
    return wav_path

@router.post("/voice-query")
async def voice_query(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    audio_path = None
    wav_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await file.read())
            audio_path = tmp.name

        wav_path = await process_audio_reasoning(audio_path)

        # Schedule file cleanup *after* response is sent
        background_tasks.add_task(os.remove, audio_path)
        background_tasks.add_task(os.remove, wav_path)

        return FileResponse(
            wav_path,
            media_type="audio/wav",
            filename=os.path.basename(wav_path),
            background=background_tasks
        )

    except Exception as e:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
        raise e


# @router.post("/voice-location")
# async def voice_with_location(
#     file: UploadFile = File(...),
#     latitude: float = Form(...),
#     longitude: float = Form(...)
# ):
#     """
#     Accepts a speech audio + coordinates and returns spoken response for nearby place query.
#     """
#     audio_path = ""
#     try:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
#             temp_audio.write(await file.read())
#             audio_path = temp_audio.name

#         location_info = await get_location_info(latitude, longitude)
#         address = location_info.get("address", "")

#         prefix = f"User is at: {address}\nQuery: "
#         result = process_audio_reasoning(audio_path, prompt_prefix=prefix)

#         return {
#             "location": location_info,
#             **result
#         }

#     finally:
#         if audio_path and os.path.exists(audio_path):
#             os.remove(audio_path)
