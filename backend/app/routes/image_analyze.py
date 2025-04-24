import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from app.modules.image_processing import groq_image_analysis, encode_image_to_base64
from app.modules.tts_module import text_to_speech

# Load env
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ImageToSpeech")

# FastAPI app
router = APIRouter()

@router.post("/describe-image-audio")
async def describe_image_and_speak(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    try:
        base64_img = encode_image_to_base64(file)

        # Groq analysis
        caption_text = groq_image_analysis(base64_img, "Describe the contents of this image.")
        ocr_text = groq_image_analysis(base64_img, "Extract all text from this image.")

        # Combine texts
        combined_text = ""
        if caption_text:
            combined_text += f"Description of image is: {caption_text}. "
        if ocr_text:
            combined_text += f"Text in image is: {ocr_text}"

        if not combined_text:
            raise HTTPException(status_code=400, detail="No useful content found in image.")

        # TTS
        audio_path = text_to_speech(combined_text)
        if not os.path.exists(audio_path):
            raise HTTPException(status_code=500, detail="TTS audio file not found.")

        # Clean up file after sending
        background_tasks.add_task(os.remove, audio_path)

        return FileResponse(
            path=audio_path,
            media_type="audio/wav",
            filename=os.path.basename(audio_path),
            background=background_tasks
        )

    except Exception as e:
        logger.exception("Image to speech processing failed")
        raise HTTPException(status_code=500, detail=str(e))
