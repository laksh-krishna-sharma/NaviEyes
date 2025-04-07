from fastapi import APIRouter, UploadFile, File, Request
import asyncio
from app.modules.image_processing import process_live_image, process_ocr_image

router = APIRouter()

@router.post("/live-capture")
async def live_capture(request: Request, file: UploadFile = File(...)):
    """
    Endpoint to process a live-captured image for captioning.
    """
    image_bytes = await file.read()
    host_url = str(request.base_url).rstrip("/")
    caption_result = await process_live_image(image_bytes, host_url)
    return {"groq_response": caption_result}

@router.post("/ocr-capture")
async def ocr_capture(request: Request, file: UploadFile = File(...)):
    """
    Endpoint to process a live-captured image for OCR.
    """
    image_bytes = await file.read()
    host_url = str(request.base_url).rstrip("/")
    ocr_result = await process_ocr_image(image_bytes, host_url)
    return ocr_result

@router.post("/combined")
async def combined_capture(request: Request, file: UploadFile = File(...)):
    """
    Endpoint to process the live-captured image for both captioning and OCR concurrently.
    """
    image_bytes = await file.read()
    host_url = str(request.base_url).rstrip("/")
    caption_task = process_live_image(image_bytes, host_url)
    ocr_task = process_ocr_image(image_bytes, host_url)
    caption_result, ocr_result = await asyncio.gather(caption_task, ocr_task)
    return {"caption": caption_result, "ocr": ocr_result}
