from fastapi import APIRouter, Query
from ml.engine import get_df
import pandas as pd

router = APIRouter()

@router.get("/list")
async def list_events(
    status: str = None,
    cause: str = None,
    priority: str = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
):
    df = get_df()
    if status:
        df = df[df["status"] == status]
    if cause:
        df = df[df["event_cause"] == cause]
    if priority:
        df = df[df["priority"] == priority]

    df = df.sort_values("start_datetime", ascending=False)
    total = len(df)
    df = df.iloc[offset : offset + limit]

    records = []
    for _, r in df.iterrows():
        records.append({
            "id": r["id"],
            "event_type": r["event_type"],
            "event_cause": r["event_cause"],
            "address": str(r["address"])[:100] if pd.notna(r["address"]) else "",
            "priority": r["priority"],
            "status": r["status"],
            "requires_road_closure": bool(r["requires_road_closure"]),
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "police_station": str(r["police_station"]) if pd.notna(r["police_station"]) else "",
            "zone": str(r["zone"]) if pd.notna(r["zone"]) else "",
            "corridor": str(r["corridor"]) if pd.notna(r["corridor"]) else "",
            "start_datetime": r["start_datetime"].isoformat() if pd.notna(r["start_datetime"]) else "",
        })
    return {"total": total, "events": records}
