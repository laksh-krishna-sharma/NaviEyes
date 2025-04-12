import os
from uuid import uuid4
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def speech_to_text(audio_file_path: str) -> str:
    """Converts speech from an audio file to text using Groq's API."""
    audio_id = str(uuid4())
    with open(audio_file_path, "rb") as audio_file:
        response = client.audio.translations.create(
            file=(audio_file_path, audio_file.read()),
            model="whisper-large-v3",  # You can change the model here
            language="en",  # Default language is English
            response_format="json",  # Get the response in JSON format
            temperature=0.0  # Optional: Fine-tune the temperature as per your need
        )
    # Return the translated text
    return response.text
