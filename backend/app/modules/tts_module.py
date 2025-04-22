import os
from uuid import uuid4
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def text_to_speech(text: str) -> str:
    max_chars = 850
    if len(text) > max_chars:
        text = text[:max_chars] + "..."

    speech_id = str(uuid4())
    file_path = f"/tmp/tts_{speech_id}.wav"

    response = client.audio.speech.create(
        model="playai-tts",
        voice="Fritz-PlayAI",
        input=text,
        response_format="wav"
    )

    with open(file_path, "wb") as f:
        response.write_to_file(file_path)

    return file_path
