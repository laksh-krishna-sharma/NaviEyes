import os
import logging
import shutil
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from fastapi.responses import JSONResponse
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

# Constants
HOST_URL = os.getenv("HOST_URL", "http://localhost:8000")

@router.post("/describe-image-audio")
async def describe_image_and_speak(file: UploadFile = File(...)):
    try:
        base64_img = encode_image_to_base64(file)

        # Parallel or sequential, using await here since Groq is sync
        caption_text = groq_image_analysis(base64_img, "Describe the contents of this image.")
        ocr_text = groq_image_analysis(base64_img, "Extract all text from this image.")

        combined_text = ""
        if caption_text:
            combined_text += f"Description of image is: {caption_text}. "
        if ocr_text:
            combined_text += f"Text in image is: {ocr_text}"

        if not combined_text:
            raise HTTPException(status_code=400, detail="No useful content found in image.")

        # Generate speech
        audio_path = text_to_speech(combined_text)
        audio_filename = os.path.basename(audio_path)
        audio_url = f"{HOST_URL}/public/{audio_filename}"

        return {
            "description": caption_text,
            "ocr_text": ocr_text,
            "combined_text": combined_text,
            "tts_audio_url": audio_url
        }

    except Exception as e:
        logger.exception("Processing failed")
        raise HTTPException(status_code=500, detail=str(e))

