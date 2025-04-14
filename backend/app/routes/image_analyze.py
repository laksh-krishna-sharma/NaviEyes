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

        # Process image concurrently for caption and OCR
        caption_task = process_live_image(image_bytes, host_url)
        ocr_task = process_ocr_image(image_bytes, host_url)
        caption_result, ocr_result = await asyncio.gather(caption_task, ocr_task)
        
        # Extract text from results, handling ChatCompletionMessage objects correctly
        # For ChatCompletionMessage objects, access the content attribute directly
        caption_text = ""
        if hasattr(caption_result, 'content'):
            # This is a ChatCompletionMessage object
            caption_text = caption_result.content.strip()
        elif isinstance(caption_result, dict) and 'content' in caption_result:
            # This is a dictionary with content key
            caption_text = caption_result['content'].strip()
        
        ocr_text = ""
        if hasattr(ocr_result, 'content'):
            # This is a ChatCompletionMessage object
            ocr_text = ocr_result.content.strip()
        elif isinstance(ocr_result, dict):
            if 'ocr_text' in ocr_result and isinstance(ocr_result['ocr_text'], dict) and 'content' in ocr_result['ocr_text']:
                # This is a nested dictionary structure
                ocr_text = ocr_result['ocr_text']['content'].strip()
            elif 'content' in ocr_result:
                # This is a simple dictionary with content key
                ocr_text = ocr_result['content'].strip()
        
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
        raise HTTPException(status_code=500, detail=str(e))