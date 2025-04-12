from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.modules.nlp import answer_query

router = APIRouter()

class QueryRequest(BaseModel):
    image_url: str
    user_question: str

@router.post("/ask")
async def ask_question(request: QueryRequest):
    """
    Answer user question based on image caption/OCR context.
    """
    if not request.image_url or not request.user_question:
        raise HTTPException(status_code=400, detail="Missing image URL or question")
    
    result = await answer_query(request.image_url, request.user_question)
    return result
