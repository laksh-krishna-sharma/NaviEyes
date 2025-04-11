from fastapi import APIRouter, Query, HTTPException
from app.modules.location_lookup import get_location_info

router = APIRouter()

@router.get("/reverse-lookup")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    """
    Reverse geocode coordinates to a readable address.
    """
    try:
        result = await get_location_info(latitude=lat, longitude=lon)
        return {"location_info": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
