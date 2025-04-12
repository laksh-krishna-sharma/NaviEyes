import os
import logging
from dotenv import load_dotenv
from groq import Groq
from app.modules.db import get_collection
from fastapi import HTTPException

load_dotenv()
logger = logging.getLogger(__name__)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

async def answer_query(image_url: str, user_question: str) -> dict:
    """
    Uses previous image data (caption or OCR) to answer user questions.
    """
    logs_collection = get_collection("logs")
    ocr_collection = get_collection("ocr_logs")

    try:
        # First try to find caption data
        record = await logs_collection.find_one({"image_url": image_url})
        context = record["response"]["content"] if record else None

        # If no caption, fallback to OCR
        if not context:
            record = await ocr_collection.find_one({"image_url": image_url})
            context = record["ocr_text"]["content"] if record else None

        if not context:
            raise HTTPException(status_code=404, detail="No previous image context found for the given URL")

        # Use LLM to answer based on context
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": "You are an assistant answering based on image content or OCR text."},
                {"role": "user", "content": f"Context:\n{context}"},
                {"role": "user", "content": f"Question:\n{user_question}"}
            ],
            temperature=0.7,
            max_completion_tokens=512,
            top_p=1,
            stream=False
        )

        return {"answer": completion.choices[0].message["content"]}

    except Exception as e:
        logger.error(f"Error during question answering: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")
