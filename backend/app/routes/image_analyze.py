
import os
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
import asyncio
from app.modules.image_processing import process_live_image, process_ocr_image
from app.modules.tts_module import text_to_speech
from dotenv import load_dotenv


load_dotenv()

router = APIRouter()

@router.post("/image-to-speech", summary="Process image to extract text and convert to speech")
async def image_to_speech(request: Request, file: UploadFile = File(...)):
    """
    Accepts an image file, processes it for caption and OCR,
    combines the results into text, and converts that text to speech.

    Returns caption, OCR result, combined text, and the TTS audio URL.
    """
    try:
        image_bytes = await file.read()
        host_url = os.getenv("HOST_URL")
        if not host_url:
            raise HTTPException(status_code=500, detail="HOST_URL not set in environment variables.")

        
        caption_task = process_live_image(image_bytes, host_url)
        ocr_task = process_ocr_image(image_bytes, host_url)
        caption_result, ocr_result = await asyncio.gather(caption_task, ocr_task)

        
        caption_text = caption_result.get("content", "").strip() if isinstance(caption_result, dict) else ""
        ocr_text = ocr_result.get("ocr_text", {}).get("content", "").strip() if isinstance(ocr_result, dict) else ""

        combined_text_parts = []
        if caption_text:
            combined_text_parts.append(f"Caption: {caption_text}")
        if ocr_text:
            combined_text_parts.append(f"OCR: {ocr_text}")

        combined_text = " ".join(combined_text_parts)

        if not combined_text:
            raise HTTPException(status_code=400, detail="No useful text extracted from the image.")

        
        tts_audio_url = text_to_speech(combined_text)

        return {
            "caption": caption_result,
            "ocr": ocr_result,
            "combined_text": combined_text,
            "tts_audio_url": tts_audio_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
