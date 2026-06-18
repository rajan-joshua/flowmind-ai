from fastapi import APIRouter
from pydantic import BaseModel
from ml.engine import recommend_resources

router = APIRouter()

class ResourceRequest(BaseModel):
    event_cause: str = "public_event"
    crowd_size: int = 10000
    risk_level: str = "High"
    zone_risk: str = "medium"
    road_closure: str = "no"

@router.post("/recommend")
async def recommend(req: ResourceRequest):
    return recommend_resources(
        event_cause=req.event_cause,
        crowd_size=req.crowd_size,
        risk_level=req.risk_level,
        zone_risk=req.zone_risk,
        road_closure=req.road_closure,
    )
