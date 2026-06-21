from fastapi import APIRouter
from pydantic import BaseModel
from ml.engine import predict_impact, get_df

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
    """Event causes the model actually has historical data for — derived live
    from the dataset rather than a hand-typed list that can drift out of sync."""
    df = get_df()
    counts = df["event_cause"].dropna().value_counts()
    return [c for c in counts.index.tolist() if counts[c] >= 2]
