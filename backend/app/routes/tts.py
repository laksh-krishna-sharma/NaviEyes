from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.modules.tts_module import text_to_speech

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/tts/convert")
async def convert_text_to_speech(payload: TTSRequest):
    try:
        audio_url = text_to_speech(payload.text)
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
