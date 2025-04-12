from fastapi import APIRouter, HTTPException, File, UploadFile
from app.modules.stt_module import speech_to_text
from pydantic import BaseModel
import os

router = APIRouter()

class STTRequest(BaseModel):
    # We might want to pass extra metadata if needed in the future
    audio_file: UploadFile

@router.post("/convert")
async def convert_speech_to_text(payload: STTRequest):
    try:
        # Save the uploaded audio file
        file_location = f"uploads/{payload.audio_file.filename}"
        with open(file_location, "wb") as f:
            f.write(await payload.audio_file.read())

        # Call the speech_to_text function
        transcription = speech_to_text(file_location)

        # Clean up by removing the uploaded file after processing
        os.remove(file_location)

        return {"transcription": transcription}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
