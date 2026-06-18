from fastapi import APIRouter
from pydantic import BaseModel
from ml.engine import get_diversion_routes

router = APIRouter()

class DiversionRequest(BaseModel):
    latitude: float = 12.9716
    longitude: float = 77.5946
    event_cause: str = "public_event"
    road_closure: str = "partial"

@router.post("/routes")
async def get_routes(req: DiversionRequest):
    return get_diversion_routes(req.latitude, req.longitude, req.event_cause, req.road_closure)
