import os
from uuid import uuid4
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def text_to_speech(text: str) -> str:
    speech_id = str(uuid4())
    filename = f"{speech_id}.wav"
    file_path = f"public/{filename}"

    model = "playai-tts"
    voice = "Fritz-PlayAI"
    response_format = "wav"

    response = client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        response_format=response_format
    )

    os.makedirs("public", exist_ok=True)
    response.write_to_file(file_path)

    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    return f"{base_url}/public/{filename}"
