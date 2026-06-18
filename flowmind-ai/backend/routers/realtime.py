from fastapi import APIRouter
from ml.engine import get_df, get_summary_stats, get_recent_active_events
import pandas as pd
from datetime import datetime

router = APIRouter()

@router.get("/pulse")
async def pulse():
    """Live pulse — call every 30s from frontend for simulated real-time updates."""
    stats = get_summary_stats()
    events = get_recent_active_events(5)
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "stats": stats,
        "active_incidents": events,
        "system_status": "operational",
    }

@router.get("/alerts")
async def alerts():
    df = get_df()
    out = []

    # Top risk zones
    zone_df = df[df["zone"].notna() & (df["zone"] != "NULL")]
    grp = zone_df.groupby("zone").agg(total=("id","count"), high=("is_high_priority","sum")).reset_index()
    grp["risk"] = (grp["high"] / grp["total"] * 100).round(1)
    top_zone = grp.sort_values("risk", ascending=False).iloc[0]
    out.append({
        "level": "CRITICAL",
        "message": f"{top_zone['zone']}: {int(top_zone['high'])} high-priority events ({top_zone['risk']}% risk rate). Immediate deployment recommended.",
    })

    # Corridor with most closures
    corr = df[(df["corridor"].notna()) & (df["corridor"] != "NULL") & (df["corridor"] != "Non-corridor") & (df["requires_road_closure"] == 1)]
    if len(corr) > 0:
        top_corr = corr["corridor"].value_counts().index[0]
        cnt = corr["corridor"].value_counts().iloc[0]
        out.append({
            "level": "WARNING",
            "message": f"{top_corr} corridor: {cnt} road closure events recorded. Diversion routes recommended.",
        })

    out.append({
        "level": "INFO",
        "message": "VIP Movement events carry 80%+ road closure rate. Pre-stage resources 2 hours before scheduled events.",
    })

    return out
