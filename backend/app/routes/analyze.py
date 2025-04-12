import os
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
import asyncio
from app.modules.image_processing import process_live_image, process_ocr_image
from app.modules.tts_module import text_to_speech
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()

@router.post("/complete", summary="Process image for caption, OCR, and TTS")
async def complete_capture(request: Request, file: UploadFile = File(...)):
    """
    Processes a live-captured image to:
      - Extract a caption via Groq (scene description)
      - Extract text via OCR
      - Combine these text outputs
      - Generate speech audio using TTS

    Returns the caption, OCR result, combined text, and audio URL.
    """
    try:
        image_bytes = await file.read()
        host_url = os.getenv("HOST_URL")
        if not host_url:
            raise HTTPException(status_code=500, detail="HOST_URL not set in environment variables.")

        # Process caption and OCR concurrently
        caption_task = process_live_image(image_bytes, host_url)
        ocr_task = process_ocr_image(image_bytes, host_url)
        caption_result, ocr_result = await asyncio.gather(caption_task, ocr_task)
        
        # Combine the outputs
        combined_text = ""
        if caption_result:
            combined_text += f"Caption: {caption_result}. "
        if ocr_result and "ocr_text" in ocr_result:
            combined_text += f"OCR: {ocr_result['ocr_text']}"
        
        if not combined_text.strip():
            raise HTTPException(status_code=400, detail="No text data extracted from image.")
        
        # Generate speech audio from combined text
        tts_audio_url = text_to_speech(combined_text)
        
        return {
            "caption": caption_result,
            "ocr": ocr_result,
            "combined_text": combined_text,
            "tts_audio_url": tts_audio_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
