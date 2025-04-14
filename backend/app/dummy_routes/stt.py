from fastapi import APIRouter, HTTPException, File, UploadFile
import os
from app.modules.stt_module import speech_to_text

router = APIRouter()

@router.post("/convert")
async def convert_speech_to_text(audio_file: UploadFile = File(...)):
    try:
        # Ensure the uploads directory exists
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        # Save the uploaded audio file
        file_location = os.path.join(upload_dir, audio_file.filename)
        with open(file_location, "wb") as f:
            f.write(await audio_file.read())

        # Run speech-to-text conversion
        transcription = speech_to_text(file_location)


        return {"transcription": transcription}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
