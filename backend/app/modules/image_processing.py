import os
import base64
import logging
from dotenv import load_dotenv
from groq import Groq
from fastapi import HTTPException, UploadFile

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GroqClient")

# Initialize Groq client
API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise EnvironmentError("GROQ_API_KEY not found in .env")
client = Groq(api_key=API_KEY)

def encode_image_to_base64(image_file: UploadFile) -> str:
    try:
        return base64.b64encode(image_file.file.read()).decode('utf-8')
    except Exception as e:
        logger.exception("Image encoding failed")
        raise HTTPException(status_code=400, detail="Image encoding failed")

def groq_image_analysis(base64_img: str, prompt: str) -> str:
    try:
        logger.info(f"Groq prompt: {prompt}")
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_img}",
                            },
                        },
                    ],
                }
            ],
            model="meta-llama/llama-4-scout-17b-16e-instruct",
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.exception("Groq analysis failed")
        raise HTTPException(status_code=500, detail="Groq analysis failed")
