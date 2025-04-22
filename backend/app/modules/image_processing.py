import os
import uuid
import logging
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
from fastapi import HTTPException
from app.modules.db import get_collection

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Initialize Groq client with API key from .env
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Define directory for temporary image storage
PUBLIC_DIR = os.path.join(os.getcwd(), "public")
if not os.path.exists(PUBLIC_DIR):
    os.makedirs(PUBLIC_DIR)

def save_temp_image(image_bytes: bytes) -> str:
    """
    Saves image bytes to a temporary file and returns the unique filename.
    """
    filename = f"{uuid.uuid4()}.jpg"
    file_path = os.path.join(PUBLIC_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            f.write(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")
    return filename

async def process_live_image(image_bytes: bytes, host_url: str) -> str:
    filename = save_temp_image(image_bytes)
    # image_url = f"{host_url}/public/{filename}"
    image_url = "https://upload.wikimedia.org/wikipedia/commons/f/f2/LPU-v1-die.jpg"

    try:
        caption_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "What is in this image?"},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                },
                {"role": "user", "content": "Tell me more about the area."}
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error from Groq API (caption): {e}")

    response_text = caption_completion.choices[0].message.content

    logs_collection = get_collection("logs")
    await logs_collection.insert_one({
        "filename": filename,
        "image_url": image_url,
        "operation": "caption",
        "response": response_text,
        "timestamp": datetime.utcnow()
    })

    return response_text


async def process_ocr_image(image_bytes: bytes, host_url: str) -> str:
    filename = save_temp_image(image_bytes)
    # image_url = f"{host_url}/public/{filename}"
    image_url = "https://upload.wikimedia.org/wikipedia/commons/f/f2/LPU-v1-die.jpg"

    try:
        ocr_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this image."},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ],
            temperature=1,
            max_completion_tokens=512,
            top_p=1,
            stream=False,
            stop=None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error from Groq API (OCR): {e}")

    ocr_text = ocr_completion.choices[0].message.content

    logs_collection = get_collection("ocr_logs")
    await logs_collection.insert_one({
        "filename": filename,
        "image_url": image_url,
        "operation": "ocr",
        "ocr_text": ocr_text,
        "timestamp": datetime.utcnow()
    })

    return ocr_text


async def cleanup_temp_images(expiration_seconds: int = 3600):
    """
    Deletes temporary images in the public directory that are older than the specified expiration time.
    """
    now = datetime.utcnow().timestamp()
    for filename in os.listdir(PUBLIC_DIR):
        file_path = os.path.join(PUBLIC_DIR, filename)
        try:
            file_stat = os.stat(file_path)
            file_age = now - file_stat.st_mtime
            if file_age > expiration_seconds:
                os.remove(file_path)
                logger.info(f"Deleted temporary file: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
