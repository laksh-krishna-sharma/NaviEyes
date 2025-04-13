from pydantic import BaseModel
from fastapi import UploadFile



class TTSRequest(BaseModel):
    text: str

class STTRequest(BaseModel):
    # We might want to pass extra metadata if needed in the future
    audio_file: UploadFile
    
# POST version with request body
class NLPRequest(BaseModel):
    prompt: str
    model: str = "deepseek-r1-distill-qwen-32b"
    