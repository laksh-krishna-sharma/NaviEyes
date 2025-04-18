import os
import asyncio
from fastapi import APIRouter, UploadFile, File, Request, HTTPException
from dotenv import load_dotenv
from app.modules.image_processing import process_live_image, process_ocr_image
from app.modules.tts_module import text_to_speech

load_dotenv()
router = APIRouter()


def extract_text_from_result(result) -> str:
    """Extracts 'content' from a response which could be ChatCompletionMessage or nested dict."""
    if hasattr(result, 'content'):
        return result.content.strip()
    if isinstance(result, dict):
        if 'ocr_text' in result and isinstance(result['ocr_text'], dict) and 'content' in result['ocr_text']:
            return result['ocr_text']['content'].strip()
        if 'content' in result:
            return result['content'].strip()
    return ""


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

        # Run caption and OCR processing concurrently
        caption_task = process_live_image(image_bytes, host_url)
        ocr_task = process_ocr_image(image_bytes, host_url)
        caption_result, ocr_result = await asyncio.gather(caption_task, ocr_task)

        # Extract text from responses
        caption_text = extract_text_from_result(caption_result)
        ocr_text = extract_text_from_result(ocr_result)

        combined_text_parts = []
        if caption_text:
            combined_text_parts.append(f"Caption: {caption_text}")
        if ocr_text:
            combined_text_parts.append(f"OCR: {ocr_text}")

        combined_text = " ".join(combined_text_parts)

        if not combined_text:
            raise HTTPException(status_code=400, detail="No useful text extracted from the image.")

        # Convert text to speech
        tts_audio_url = text_to_speech(combined_text)

        return {
            "caption": caption_text,
            "ocr": ocr_text,
            "combined_text": combined_text,
            "tts_audio_url": tts_audio_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
