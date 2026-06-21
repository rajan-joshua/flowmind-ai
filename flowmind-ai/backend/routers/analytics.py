from fastapi import APIRouter
from ml.engine import (
    get_summary_stats, get_cause_distribution, get_monthly_trend,
    get_hourly_pattern, get_zone_risk, get_corridor_stats,
    get_police_station_stats, get_closure_by_cause, get_heatmap_points,
    get_recent_active_events
)

router = APIRouter()

@router.get("/summary")
async def summary():
    return get_summary_stats()

@router.get("/cause-distribution")
async def cause_distribution():
    return get_cause_distribution()

@router.get("/monthly-trend")
async def monthly_trend():
    return get_monthly_trend()

@router.get("/hourly-pattern")
async def hourly_pattern():
    return get_hourly_pattern()

@router.get("/zone-risk")
async def zone_risk():
    return get_zone_risk()

@router.get("/corridor-stats")
async def corridor_stats():
    return get_corridor_stats()

@router.get("/police-stations")
async def police_stations():
    return get_police_station_stats()

@router.get("/closure-by-cause")
async def closure_by_cause():
    return get_closure_by_cause()

@router.get("/heatmap")
async def heatmap(limit: int = 500):
    return get_heatmap_points(limit)

@router.get("/recent-events")
async def recent_events(limit: int = 20):
    return get_recent_active_events(limit)
