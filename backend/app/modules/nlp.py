from groq import Groq
from typing import Dict
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def run_nlp_reasoning(prompt: str) -> Dict:
    """
    Perform NLP reasoning using Groq API.

    Args:
        prompt (str): The input string/question for NLP reasoning.

    Returns:
        Dict: The result including reasoning (if available) and final response.
    """
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides accurate and concise answers."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_completion_tokens=1024,
            top_p=0.95,
            stream=False
        )

        result_content = response.choices[0].message.content
        return {
            "success": True,
            "response": result_content
        }

    except Exception as e:
        logger.error(f"NLP reasoning error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
