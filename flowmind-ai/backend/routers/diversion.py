from fastapi import APIRouter
from pydantic import BaseModel
from ml.engine import get_diversion_routes

router = APIRouter()

class DiversionRequest(BaseModel):
    latitude: float = 12.9716
    longitude: float = 77.5946
    event_cause: str = "public_event"
    road_closure: str = "partial"
    congestion_score: float = 60.0   # now passed from frontend after ML prediction
    zone_risk: str = "medium"

@router.post("/routes")
async def get_routes(req: DiversionRequest):
    return get_diversion_routes(
        latitude=req.latitude,
        longitude=req.longitude,
        event_cause=req.event_cause,
        road_closure=req.road_closure,
        congestion_score=req.congestion_score,
        zone_risk=req.zone_risk,
    )
