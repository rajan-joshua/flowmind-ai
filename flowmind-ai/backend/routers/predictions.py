from fastapi import APIRouter
from pydantic import BaseModel
from ml.engine import predict_impact

router = APIRouter()

class PredictionRequest(BaseModel):
    event_cause: str = "public_event"
    crowd_size: int = 10000
    time_of_day: str = "evening"   # morning | afternoon | evening | night
    zone_risk: str = "medium"      # high | medium | low
    road_closure: str = "no"       # no | partial | full
    is_planned: bool = True

@router.post("/predict")
async def predict(req: PredictionRequest):
    return predict_impact(
        event_cause=req.event_cause,
        crowd_size=req.crowd_size,
        time_of_day=req.time_of_day,
        zone_risk=req.zone_risk,
        road_closure=req.road_closure,
        is_planned=req.is_planned,
    )

@router.get("/causes")
async def list_causes():
    return [
        "vehicle_breakdown","accident","public_event","procession",
        "vip_movement","construction","water_logging","pot_holes",
        "tree_fall","road_conditions","congestion","protest","others"
    ]
