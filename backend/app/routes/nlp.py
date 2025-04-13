from fastapi import APIRouter, Query
from app.modules.nlp import run_nlp_reasoning
from app.models.schema import NLPRequest
router = APIRouter()

# GET version with query parameter
@router.get("/nlp-test")
def test_nlp_get(prompt: str = Query(..., 
                   example="How many r's are in strawberry?",
                   description="Your question for NLP processing")):
    result = run_nlp_reasoning(prompt)
    return {"result": result}
    

@router.post("/nlp-test")
def test_nlp_post(request: NLPRequest):
    result = run_nlp_reasoning(request.prompt)
    return {"result": result}
