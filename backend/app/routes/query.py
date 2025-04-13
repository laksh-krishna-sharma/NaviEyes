from fastapi import APIRouter

router = APIRouter()  

@router.get("/")
async def query_endpoint():
    return {"message": "Query endpoint"}