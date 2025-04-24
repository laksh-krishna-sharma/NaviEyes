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
    response_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await file.read())
            audio_path = tmp.name

        prompt = speech_to_text(audio_path)
        reasoning = run_nlp_reasoning(prompt)
        if not reasoning["success"]:
            raise HTTPException(status_code=500, detail=reasoning["error"])
        response_text = reasoning["response"]
        
        response_path = text_to_speech(response_text)
        
        # Check if it's a WAV file or a TXT file
        if response_path.endswith('.wav'):
            # It's an audio file, return it as usual
            background_tasks.add_task(os.remove, audio_path)
            background_tasks.add_task(os.remove, response_path)
            
            return FileResponse(
                response_path,
                media_type="audio/wav",
                filename=os.path.basename(response_path),
                background=background_tasks
            )
        else:
            # It's a text file, return the text as JSON
            with open(response_path, 'r') as f:
                text_content = f.read()
                
            background_tasks.add_task(os.remove, audio_path)
            background_tasks.add_task(os.remove, response_path)
            
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=200,
                content={"text_response": text_content}
            )

    except Exception as e:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        if response_path and os.path.exists(response_path):
            os.remove(response_path)
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
