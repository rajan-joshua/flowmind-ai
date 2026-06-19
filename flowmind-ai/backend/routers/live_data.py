"""
live_data.py — Live Traffic & Events Router
Fetches real-time data from:
  1. Google Maps Roads API (traffic conditions on Bengaluru roads)
  2. Google Places API  (nearby events / points of interest)
  3. OpenStreetMap Overpass API (free fallback for road/incident data)
  4. PredictHQ / Ticketmaster API (live public events near Bengaluru)
"""

from fastapi import APIRouter, Query
import httpx, os, asyncio, math, random
from datetime import datetime, timedelta

router = APIRouter()

GOOGLE_API_KEY        = os.getenv("GOOGLE_API_KEY", "")
PREDICTHQ_TOKEN       = os.getenv("PREDICTHQ_TOKEN", "")
TICKETMASTER_API_KEY  = os.getenv("TICKETMASTER_API_KEY", "")

# Bengaluru bounding box
BLR_LAT, BLR_LNG = 12.9716, 77.5946
BLR_BBOX = "12.7,77.3,13.2,77.9"   # south,west,north,east

# ─── Major Bengaluru road segments for traffic probing ────────────────────────
BLR_ROAD_SEGMENTS = [
    {"name": "Outer Ring Road (ORR)", "lat": 12.9352, "lng": 77.6244, "corridor": "ORR"},
    {"name": "Mysore Road",           "lat": 12.9534, "lng": 77.5177, "corridor": "Mysore Rd"},
    {"name": "Bellary Road (NH-44)",  "lat": 13.0358, "lng": 77.5970, "corridor": "Bellary Rd"},
    {"name": "Tumkur Road (NH-48)",   "lat": 13.0176, "lng": 77.5408, "corridor": "Tumkur Rd"},
    {"name": "Old Madras Road",       "lat": 12.9999, "lng": 77.6598, "corridor": "Old Madras Rd"},
    {"name": "Hosur Road",            "lat": 12.8999, "lng": 77.6413, "corridor": "Hosur Rd"},
    {"name": "Bannerghatta Road",     "lat": 12.8676, "lng": 77.6015, "corridor": "Bannerghatta Rd"},
    {"name": "MG Road / Brigade Rd",  "lat": 12.9762, "lng": 77.6033, "corridor": "MG Rd"},
    {"name": "Sarjapur Road",         "lat": 12.9010, "lng": 77.6710, "corridor": "Sarjapur Rd"},
    {"name": "Whitefield Main Rd",    "lat": 12.9698, "lng": 77.7499, "corridor": "Whitefield"},
    {"name": "Electronic City Flyover","lat":12.8458, "lng": 77.6633, "corridor": "Electronic City"},
    {"name": "Hebbal Flyover",        "lat": 13.0358, "lng": 77.5970, "corridor": "Hebbal"},
    {"name": "Silk Board Junction",   "lat": 12.9176, "lng": 77.6233, "corridor": "Silk Board"},
    {"name": "KR Pura Bridge",        "lat": 13.0044, "lng": 77.7016, "corridor": "KR Pura"},
    {"name": "Marathahalli Bridge",   "lat": 12.9591, "lng": 77.6974, "corridor": "Marathahalli"},
]

# ─── Helpers ──────────────────────────────────────────────────────────────────
def _sim_traffic(seed: float, time_bias: float = 1.0) -> dict:
    """
    Deterministic-ish simulated traffic for a road segment.
    Used when Google API key is absent, so the UI still works.
    """
    random.seed(int(seed * 1000) + int(datetime.utcnow().minute / 5))
    hour = datetime.utcnow().hour
    # Peak hours in Bengaluru: 8-10am and 8-10pm
    peak = 1.4 if hour in range(8, 10) or hour in range(20, 22) else (
           1.2 if hour in range(17, 20) else 0.7
    )
    base = random.uniform(30, 95) * peak * time_bias
    speed_kph = max(5, 60 - base * 0.5 + random.uniform(-5, 5))
    level = ("Critical" if base > 80 else "Heavy" if base > 60 else
             "Moderate" if base > 40 else "Normal")
    color = {"Critical": "#EF4444", "Heavy": "#F97316",
             "Moderate": "#F59E0B", "Normal": "#10B981"}[level]
    return {
        "congestion_pct": round(min(base, 99), 1),
        "speed_kph": round(speed_kph, 1),
        "level": level,
        "color": color,
        "delay_min": max(0, round((60 / max(speed_kph, 5) - 60 / 60) * 10, 0)),
    }


async def _google_distance_matrix(origin: str, destination: str) -> dict | None:
    """Use Distance Matrix API to get travel time and traffic."""
    if not GOOGLE_API_KEY:
        return None
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": origin,
        "destinations": destination,
        "departure_time": "now",
        "traffic_model": "best_guess",
        "key": GOOGLE_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(url, params=params)
            data = r.json()
        elem = data["rows"][0]["elements"][0]
        if elem["status"] != "OK":
            return None
        return {
            "duration_normal_s": elem["duration"]["value"],
            "duration_traffic_s": elem.get("duration_in_traffic", {}).get("value", elem["duration"]["value"]),
            "distance_m": elem["distance"]["value"],
        }
    except Exception:
        return None


# ─── Live Traffic Endpoint ────────────────────────────────────────────────────
@router.get("/traffic")
async def live_traffic():
    """
    Returns congestion data for 15 major Bengaluru road segments.
    If GOOGLE_API_KEY is set, uses Distance Matrix API for each segment.
    Falls back to time-aware simulation otherwise.
    """
    results = []

    async def process_segment(seg: dict):
        gm = None
        if GOOGLE_API_KEY:
            origin = f"{seg['lat']},{seg['lng']}"
            # Probe 1 km along the road
            dest_lat = seg["lat"] + 0.009
            dest_lng = seg["lng"] + 0.009
            gm = await _google_distance_matrix(origin, f"{dest_lat},{dest_lng}")

        if gm:
            delay_ratio = gm["duration_traffic_s"] / max(gm["duration_normal_s"], 1)
            congestion = min(int((delay_ratio - 1) * 120), 99)
            congestion = max(congestion, 5)
            dist_km = gm["distance_m"] / 1000
            speed = (dist_km / (gm["duration_traffic_s"] / 3600)) if gm["duration_traffic_s"] > 0 else 40
            level = ("Critical" if congestion > 80 else "Heavy" if congestion > 60 else
                     "Moderate" if congestion > 35 else "Normal")
            color = {"Critical": "#EF4444", "Heavy": "#F97316",
                     "Moderate": "#F59E0B", "Normal": "#10B981"}[level]
            traffic = {
                "congestion_pct": congestion,
                "speed_kph": round(speed, 1),
                "level": level,
                "color": color,
                "delay_min": round((gm["duration_traffic_s"] - gm["duration_normal_s"]) / 60, 0),
                "source": "google",
            }
        else:
            traffic = _sim_traffic(seg["lat"] + seg["lng"])
            traffic["source"] = "simulated"

        return {
            "name": seg["name"],
            "lat": seg["lat"],
            "lng": seg["lng"],
            "corridor": seg["corridor"],
            "timestamp": datetime.utcnow().isoformat(),
            **traffic,
        }

    tasks = [process_segment(s) for s in BLR_ROAD_SEGMENTS]
    results = await asyncio.gather(*tasks)
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "source": "google" if GOOGLE_API_KEY else "simulated",
        "segments": list(results),
    }


# ─── Live Events Endpoint ─────────────────────────────────────────────────────
@router.get("/events")
async def live_events():
    """
    Fetches live public events near Bengaluru from:
      1. PredictHQ API   (PREDICTHQ_TOKEN required)
      2. Ticketmaster API (TICKETMASTER_API_KEY required)
      3. Google Places (Nearby Search – events category) (GOOGLE_API_KEY required)
      4. Synthetic fallback with realistic Bengaluru events
    """
    all_events = []

    # ── 1. PredictHQ ──────────────────────────────────────────────────────────
    if PREDICTHQ_TOKEN:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    "https://api.predicthq.com/v1/events/",
                    headers={"Authorization": f"Bearer {PREDICTHQ_TOKEN}"},
                    params={
                        "within": "30km@12.9716,77.5946",
                        "active.gte": datetime.utcnow().date().isoformat(),
                        "active.lte": (datetime.utcnow() + timedelta(days=7)).date().isoformat(),
                        "limit": 25,
                        "sort": "-rank",
                    },
                )
                data = r.json()
                for e in data.get("results", []):
                    geo = e.get("geo", {})
                    coords = geo.get("geometry", {}).get("coordinates", [None, None])
                    all_events.append({
                        "id": e["id"],
                        "title": e["title"],
                        "category": e.get("category", "event"),
                        "lat": coords[1] if coords[1] else BLR_LAT + random.uniform(-0.1, 0.1),
                        "lng": coords[0] if coords[0] else BLR_LNG + random.uniform(-0.1, 0.1),
                        "start": e.get("start", ""),
                        "rank": e.get("rank", 50),
                        "expected_attendance": e.get("phq_attendance", 0),
                        "source": "predicthq",
                        "url": e.get("url", ""),
                    })
        except Exception as ex:
            print(f"PredictHQ error: {ex}")

    # ── 2. Ticketmaster ───────────────────────────────────────────────────────
    if TICKETMASTER_API_KEY and len(all_events) < 10:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    "https://app.ticketmaster.com/discovery/v2/events.json",
                    params={
                        "apikey": TICKETMASTER_API_KEY,
                        "latlong": f"{BLR_LAT},{BLR_LNG}",
                        "radius": "30",
                        "unit": "km",
                        "size": 20,
                        "sort": "date,asc",
                    },
                )
                data = r.json()
                for e in data.get("_embedded", {}).get("events", []):
                    venue = e.get("_embedded", {}).get("venues", [{}])[0]
                    loc = venue.get("location", {})
                    all_events.append({
                        "id": e["id"],
                        "title": e["name"],
                        "category": e.get("classifications", [{}])[0].get("segment", {}).get("name", "event"),
                        "lat": float(loc.get("latitude", BLR_LAT + random.uniform(-0.1, 0.1))),
                        "lng": float(loc.get("longitude", BLR_LNG + random.uniform(-0.1, 0.1))),
                        "start": e.get("dates", {}).get("start", {}).get("dateTime", ""),
                        "rank": 60,
                        "expected_attendance": 5000,
                        "source": "ticketmaster",
                        "url": e.get("url", ""),
                    })
        except Exception as ex:
            print(f"Ticketmaster error: {ex}")

    # ── 3. Google Places (events category) ───────────────────────────────────
    if GOOGLE_API_KEY and len(all_events) < 5:
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                r = await client.get(
                    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                    params={
                        "location": f"{BLR_LAT},{BLR_LNG}",
                        "radius": 20000,
                        "type": "event_venue",
                        "key": GOOGLE_API_KEY,
                    },
                )
                data = r.json()
                for p in data.get("results", [])[:10]:
                    loc = p["geometry"]["location"]
                    all_events.append({
                        "id": p["place_id"],
                        "title": p["name"],
                        "category": "venue",
                        "lat": loc["lat"],
                        "lng": loc["lng"],
                        "start": datetime.utcnow().isoformat(),
                        "rank": int(p.get("rating", 3) * 15),
                        "expected_attendance": 2000,
                        "source": "google_places",
                        "url": "",
                    })
        except Exception as ex:
            print(f"Google Places error: {ex}")

    # ── 4. Synthetic fallback ─────────────────────────────────────────────────
    if len(all_events) < 3:
        random.seed(int(datetime.utcnow().hour / 2))
        synthetic = [
            {"title": "Bengaluru Tech Summit 2025", "category": "conferences", "lat": 12.9279, "lng": 77.6271, "rank": 85, "expected_attendance": 15000},
            {"title": "BBMP Road Maintenance — MG Road", "category": "construction", "lat": 12.9762, "lng": 77.6033, "rank": 70, "expected_attendance": 0},
            {"title": "IPL Watch Party — Chinnaswamy Stadium", "category": "sports", "lat": 12.9788, "lng": 77.5996, "rank": 90, "expected_attendance": 40000},
            {"title": "VIP Movement — Raj Bhavan", "category": "public-authority", "lat": 12.9977, "lng": 77.5921, "rank": 80, "expected_attendance": 0},
            {"title": "Kempegowda Jayanti Procession", "category": "festivals", "lat": 12.9767, "lng": 77.5713, "rank": 75, "expected_attendance": 25000},
            {"title": "Namma Metro Construction — ORR", "category": "construction", "lat": 12.9352, "lng": 77.6244, "rank": 65, "expected_attendance": 0},
            {"title": "Silk Board Weekly Market", "category": "community", "lat": 12.9176, "lng": 77.6233, "rank": 55, "expected_attendance": 8000},
            {"title": "Water Logging — Bellandur Lake", "category": "disaster", "lat": 12.9254, "lng": 77.6817, "rank": 72, "expected_attendance": 0},
            {"title": "Whitefield Tech Park Job Fair", "category": "expos", "lat": 12.9698, "lng": 77.7499, "rank": 60, "expected_attendance": 5000},
            {"title": "Lal Bagh Flower Show", "category": "festivals", "lat": 12.9507, "lng": 77.5848, "rank": 78, "expected_attendance": 20000},
        ]
        for i, s in enumerate(synthetic):
            all_events.append({
                "id": f"sim_{i}",
                "source": "simulated",
                "start": (datetime.utcnow() + timedelta(hours=random.randint(0, 24))).isoformat(),
                "url": "",
                **s,
            })

    # Attach risk level per event
    for e in all_events:
        crowd = e.get("expected_attendance", 0)
        rank  = e.get("rank", 50)
        risk_score = min(int(rank * 0.6 + (crowd / 1000) * 2), 99)
        e["risk_score"] = risk_score
        e["risk_level"] = ("Critical" if risk_score >= 75 else "High" if risk_score >= 55 else
                           "Moderate" if risk_score >= 35 else "Low")
        e["risk_color"] = {"Critical": "#EF4444", "High": "#F97316",
                           "Moderate": "#F59E0B", "Low": "#10B981"}[e["risk_level"]]

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "total": len(all_events),
        "sources_active": list({e["source"] for e in all_events}),
        "events": all_events,
    }


# ─── Combined Live Dashboard Pulse ───────────────────────────────────────────
@router.get("/dashboard")
async def live_dashboard():
    """Combined live snapshot for the Command Center live-data tab."""
    traffic_task = live_traffic()
    events_task  = live_events()
    traffic, events = await asyncio.gather(traffic_task, events_task)

    critical_roads = [s for s in traffic["segments"] if s["level"] in ("Critical", "Heavy")]
    high_risk_events = [e for e in events["events"] if e["risk_level"] in ("Critical", "High")]

    avg_congestion = (
        sum(s["congestion_pct"] for s in traffic["segments"]) / len(traffic["segments"])
        if traffic["segments"] else 0
    )

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "summary": {
            "avg_city_congestion": round(avg_congestion, 1),
            "critical_roads": len(critical_roads),
            "live_events": events["total"],
            "high_risk_events": len(high_risk_events),
        },
        "traffic": traffic,
        "events": events,
    }
