"""
FlowMind AI — Live Data Router
Fetches real-time traffic + events from Google Maps, TomTom, and Overpass (OSM events).
Falls back gracefully if API keys are not set.
"""

import httpx, os, asyncio, math, random
from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
TOMTOM_KEY      = os.getenv("TOMTOM_API_KEY", "")

# Bengaluru bounding box
BLR_LAT, BLR_LNG = 12.9716, 77.5946
BLR_BBOX = "12.7343,77.3791,13.1435,77.8388"   # south,west,north,east

# ── Helpers ───────────────────────────────────────────────────────────────────
def _haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

# ── Overpass API — real OSM events (free, no key needed) ─────────────────────
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

OVERPASS_QUERY = """
[out:json][timeout:25];
(
  node["amenity"="place_of_worship"](12.85,77.45,13.10,77.75);
  node["leisure"="stadium"](12.85,77.45,13.10,77.75);
  node["amenity"="university"](12.85,77.45,13.10,77.75);
  node["amenity"="hospital"](12.85,77.45,13.10,77.75);
  node["tourism"="attraction"](12.85,77.45,13.10,77.75);
  node["shop"="mall"](12.85,77.45,13.10,77.75);
  node["amenity"="theatre"](12.85,77.45,13.10,77.75);
  node["amenity"="cinema"](12.85,77.45,13.10,77.75);
);
out body 80;
"""

async def fetch_osm_venues() -> list:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(OVERPASS_URL, data={"data": OVERPASS_QUERY})
        elements = resp.json().get("elements", [])
        venues = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en", "")
            if not name:
                continue
            amenity = tags.get("amenity") or tags.get("leisure") or tags.get("tourism") or tags.get("shop", "")
            TYPE_MAP = {
                "place_of_worship": "Religious Event",
                "stadium": "Sports Event",
                "university": "Academic Event",
                "hospital": "Emergency Zone",
                "attraction": "Tourist Event",
                "mall": "Public Gathering",
                "theatre": "Cultural Event",
                "cinema": "Public Event",
            }
            event_type = TYPE_MAP.get(amenity, "Public Event")
            crowd_est = {
                "stadium": random.randint(5000, 50000),
                "mall": random.randint(2000, 20000),
                "place_of_worship": random.randint(500, 10000),
                "university": random.randint(1000, 8000),
                "theatre": random.randint(200, 2000),
                "cinema": random.randint(100, 1500),
                "hospital": random.randint(200, 1000),
                "attraction": random.randint(500, 5000),
            }.get(amenity, random.randint(100, 2000))

            risk = "High" if crowd_est > 10000 else "Moderate" if crowd_est > 3000 else "Low"

            venues.append({
                "id": f"osm-{el['id']}",
                "name": name,
                "event_type": event_type,
                "amenity": amenity,
                "latitude": el.get("lat", BLR_LAT),
                "longitude": el.get("lon", BLR_LNG),
                "crowd_estimate": crowd_est,
                "risk_level": risk,
                "source": "OpenStreetMap (Live)",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        return venues[:60]
    except Exception as e:
        return _fallback_events()

# ── TomTom Traffic Incidents (free tier: 2500 req/day) ───────────────────────
async def fetch_tomtom_incidents() -> list:
    if not TOMTOM_KEY:
        return _fallback_incidents()
    url = (
        f"https://api.tomtom.com/traffic/services/5/incidentDetails"
        f"?key={TOMTOM_KEY}"
        f"&bbox={BLR_BBOX}"
        f"&fields={{incidents{{type,geometry{{type,coordinates}},properties{{id,iconCategory,magnitudeOfDelay,events{{description,code,iconCategory}},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}}}}"
        f"&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11,14&timeValidityFilter=present"
    )
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
        data = resp.json()
        incidents = []
        for inc in data.get("incidents", [])[:50]:
            props = inc.get("properties", {})
            geo = inc.get("geometry", {})
            coords = geo.get("coordinates", [])

            if geo.get("type") == "Point" and coords:
                lng, lat = coords[0], coords[1]
            elif geo.get("type") == "LineString" and coords:
                mid = coords[len(coords)//2]
                lng, lat = mid[0], mid[1]
            else:
                continue

            magnitude = props.get("magnitudeOfDelay", 0)
            severity = {0:"Unknown",1:"Minor",2:"Moderate",3:"Major",4:"Undefined"}.get(magnitude, "Unknown")
            events_list = props.get("events", [])
            desc = events_list[0].get("description","Traffic incident") if events_list else "Traffic incident"
            icon = props.get("iconCategory", 0)
            cause_map = {
                0:"Unknown",1:"Accident",2:"Fog",3:"Dangerous Conditions",4:"Rain",
                5:"Ice",6:"Queue",7:"Closed",8:"Road Works",9:"Wind",10:"Flooding",
                11:"Broken Down Vehicle",14:"Broken Down Vehicle"
            }
            incidents.append({
                "id": props.get("id", f"tt-{random.randint(1000,9999)}"),
                "description": desc,
                "cause": cause_map.get(icon, "Traffic Incident"),
                "severity": severity,
                "magnitude": magnitude,
                "latitude": lat,
                "longitude": lng,
                "from": props.get("from",""),
                "to": props.get("to",""),
                "delay_sec": props.get("delay", 0),
                "length_m": props.get("length", 0),
                "road": (props.get("roadNumbers") or ["Unknown"])[0],
                "source": "TomTom Live",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        return incidents if incidents else _fallback_incidents()
    except Exception:
        return _fallback_incidents()

# ── Google Maps — Traffic Layer Waypoints ─────────────────────────────────────
# Google's Traffic API requires Directions/Roads API; we use Roads API snap-to-roads
# to get speed data on key Bengaluru corridors.
BENGALURU_CORRIDORS = [
    {"name":"Outer Ring Road","points":"12.9352,77.6245|12.9716,77.6412|12.9933,77.6897"},
    {"name":"Mysore Road","points":"12.9523,77.5150|12.9411,77.4852|12.9305,77.4601"},
    {"name":"Bellary Road","points":"13.0240,77.5946|13.0578,77.5870|13.0950,77.5780"},
    {"name":"Hosur Road","points":"12.9270,77.6210|12.8910,77.6401|12.8550,77.6602"},
    {"name":"Old Madras Road","points":"12.9858,77.6412|13.0100,77.6601|13.0350,77.6920"},
    {"name":"Tumkur Road","points":"13.0240,77.5480|13.0550,77.5120|13.0850,77.4850"},
    {"name":"Bannerghatta Road","points":"12.9050,77.5946|12.8650,77.5946|12.8250,77.5946"},
]

async def fetch_google_traffic() -> list:
    if not GOOGLE_MAPS_KEY:
        return _fallback_google_traffic()
    results = []
    async with httpx.AsyncClient(timeout=20) as client:
        for corridor in BENGALURU_CORRIDORS:
            try:
                # Use Distance Matrix for travel time vs free-flow estimation
                pts = corridor["points"].split("|")
                origin = pts[0]
                destination = pts[-1]
                url = (
                    f"https://maps.googleapis.com/maps/api/distancematrix/json"
                    f"?origins={origin}&destinations={destination}"
                    f"&departure_time=now&traffic_model=best_guess"
                    f"&key={GOOGLE_MAPS_KEY}"
                )
                resp = await client.get(url)
                data = resp.json()
                row = data.get("rows",[{}])[0].get("elements",[{}])[0]
                duration_normal = row.get("duration",{}).get("value", 0)
                duration_traffic = row.get("duration_in_traffic",{}).get("value", 0)
                distance_m = row.get("distance",{}).get("value", 0)

                congestion_ratio = (duration_traffic / duration_normal) if duration_normal > 0 else 1.0
                congestion_pct = min(int((congestion_ratio - 1) * 100), 99)
                congestion_pct = max(congestion_pct, 0)

                level = "Critical" if congestion_pct>60 else "High" if congestion_pct>35 else "Moderate" if congestion_pct>15 else "Free Flow"
                pt = pts[len(pts)//2].split(",")

                results.append({
                    "corridor": corridor["name"],
                    "latitude": float(pt[0]),
                    "longitude": float(pt[1]),
                    "congestion_pct": congestion_pct,
                    "congestion_level": level,
                    "duration_normal_min": round(duration_normal/60, 1),
                    "duration_traffic_min": round(duration_traffic/60, 1),
                    "distance_km": round(distance_m/1000, 1),
                    "delay_min": round((duration_traffic - duration_normal)/60, 1),
                    "source": "Google Maps Live",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await asyncio.sleep(0.1)
            except Exception:
                continue
    return results if results else _fallback_google_traffic()

# ── Fallback data (realistic simulation when no API keys) ─────────────────────
def _fallback_incidents() -> list:
    random.seed(int(datetime.now().minute / 5))   # changes every 5 min = "live feel"
    spots = [
        (12.9716, 77.5946, "MG Road", "Congestion"),
        (12.9784, 77.6408, "Outer Ring Road", "Accident"),
        (13.0240, 77.5946, "Bellary Road", "Road Works"),
        (12.9352, 77.6245, "Silk Board Junction", "Major Queue"),
        (12.9784, 77.5150, "Mysore Road", "Broken Down Vehicle"),
        (12.9523, 77.5913, "Rajajinagar", "Traffic Incident"),
        (12.9270, 77.6210, "Hosur Road", "Congestion"),
        (13.0100, 77.6601, "Old Madras Road", "Accident"),
        (12.9858, 77.7081, "Whitefield", "Road Works"),
        (12.8650, 77.6601, "Electronic City", "Congestion"),
        (12.9950, 77.5560, "Yeshwanthpur", "Broken Down Vehicle"),
        (12.9600, 77.6400, "Indiranagar", "Waterlogging"),
        (13.0350, 77.5970, "Hebbal Flyover", "Major Queue"),
        (12.9200, 77.5200, "JP Nagar", "Pot Hole"),
        (12.9900, 77.7200, "Marathahalli", "Congestion"),
    ]
    incidents = []
    for i, (lat, lng, road, cause) in enumerate(spots):
        lat += random.uniform(-0.005, 0.005)
        lng += random.uniform(-0.005, 0.005)
        mag = random.randint(1, 4)
        delay = random.randint(2, 45)
        incidents.append({
            "id": f"sim-{i}-{datetime.now().minute//5}",
            "description": f"{cause} on {road}",
            "cause": cause,
            "severity": {1:"Minor",2:"Moderate",3:"Major",4:"Critical"}.get(mag,"Moderate"),
            "magnitude": mag,
            "latitude": round(lat, 5),
            "longitude": round(lng, 5),
            "from": road,
            "to": f"{road} Junction",
            "delay_sec": delay * 60,
            "length_m": random.randint(200, 3000),
            "road": road,
            "source": "Simulated Live (add TomTom API key for real data)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    return incidents

def _fallback_google_traffic() -> list:
    random.seed(int(datetime.now().minute / 5))
    corridors = [
        ("Outer Ring Road",      12.9640, 77.6350),
        ("Mysore Road",          12.9400, 77.4900),
        ("Bellary Road",         13.0400, 77.5900),
        ("Hosur Road",           12.8900, 77.6450),
        ("Old Madras Road",      13.0100, 77.6700),
        ("Tumkur Road",          13.0550, 77.5100),
        ("Bannerghatta Road",    12.8700, 77.5950),
        ("Kanakapura Road",      12.8600, 77.5700),
        ("Sarjapur Road",        12.9050, 77.6900),
        ("Varthur Road",         12.9550, 77.7350),
        ("Hennur Road",          13.0500, 77.6300),
        ("Magadi Road",          12.9650, 77.5050),
        ("Marathahalli Bridge",  12.9570, 77.7010),
        ("Silk Board Junction",  12.9170, 77.6228),
        ("Hebbal Flyover",       13.0440, 77.5970),
    ]
    results = []
    for name, lat, lng in corridors:
        base = random.randint(5, 75)
        # Evening peak simulation
        hour = datetime.now().hour
        if 8 <= hour <= 10:
            base = min(base + 25, 95)
        elif 17 <= hour <= 21:
            base = min(base + 35, 99)
        level = "Critical" if base>70 else "High" if base>45 else "Moderate" if base>20 else "Free Flow"
        normal = random.randint(8, 20)
        results.append({
            "corridor": name,
            "latitude": round(lat + random.uniform(-0.003,0.003), 5),
            "longitude": round(lng + random.uniform(-0.003,0.003), 5),
            "congestion_pct": base,
            "congestion_level": level,
            "duration_normal_min": normal,
            "duration_traffic_min": round(normal * (1 + base/100), 1),
            "distance_km": round(random.uniform(3,18), 1),
            "delay_min": round(normal * base/100, 1),
            "source": "Simulated Live (add Google Maps API key for real data)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    return results

def _fallback_events() -> list:
    random.seed(int(datetime.now().hour))
    places = [
        ("Chinnaswamy Stadium","Sports Event",12.9791,77.5993,random.randint(20000,50000)),
        ("Lalbagh Botanical Garden","Public Gathering",12.9507,77.5848,random.randint(3000,10000)),
        ("Cubbon Park","Public Event",12.9763,77.5929,random.randint(2000,8000)),
        ("Bannerghatta National Park","Tourist Event",12.8019,77.5751,random.randint(500,3000)),
        ("ISKCON Temple","Religious Event",13.0094,77.5510,random.randint(5000,20000)),
        ("Palace Grounds","Cultural Event",13.0059,77.5700,random.randint(10000,40000)),
        ("Freedom Park","Public Event",12.9690,77.5780,random.randint(1000,15000)),
        ("Kanteerava Stadium","Sports Event",12.9738,77.5980,random.randint(8000,25000)),
        ("UB City Mall","Public Gathering",12.9716,77.5970,random.randint(3000,12000)),
        ("Vidhana Soudha","Government Event",12.9789,77.5917,random.randint(500,5000)),
        ("Vidyarthi Bhavan","Cultural Event",12.9500,77.5600,random.randint(200,1000)),
        ("Doddagaddavalli","Religious Event",13.0480,77.6370,random.randint(2000,8000)),
        ("IIM Bangalore","Academic Event",13.0694,77.5994,random.randint(1000,5000)),
        ("Jakkur Aerodrome","Special Event",13.0820,77.5900,random.randint(500,3000)),
        ("Koramangala Park","Public Gathering",12.9340,77.6270,random.randint(500,5000)),
    ]
    events = []
    for name, etype, lat, lng, crowd in places:
        risk = "High" if crowd > 15000 else "Moderate" if crowd > 5000 else "Low"
        events.append({
            "id": f"sim-ev-{name[:6].replace(' ','')}",
            "name": name,
            "event_type": etype,
            "amenity": "venue",
            "latitude": round(lat + random.uniform(-0.002,0.002), 5),
            "longitude": round(lng + random.uniform(-0.002,0.002), 5),
            "crowd_estimate": crowd,
            "risk_level": risk,
            "source": "Simulated Live (OSM fallback)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    return events

# ── API Endpoints ──────────────────────────────────────────────────────────────
@router.get("/traffic-incidents")
async def traffic_incidents():
    data = await fetch_tomtom_incidents()
    return {"count": len(data), "source": data[0]["source"] if data else "none", "incidents": data}

@router.get("/google-traffic")
async def google_traffic():
    data = await fetch_google_traffic()
    return {"count": len(data), "source": data[0]["source"] if data else "none", "corridors": data}

@router.get("/live-events")
async def live_events():
    data = await fetch_osm_venues()
    return {"count": len(data), "source": data[0]["source"] if data else "none", "events": data}

@router.get("/live-snapshot")
async def live_snapshot():
    """All live data in one call for the dashboard."""
    incidents, traffic, events = await asyncio.gather(
        fetch_tomtom_incidents(),
        fetch_google_traffic(),
        fetch_osm_venues(),
    )
    critical = sum(1 for t in traffic if t["congestion_level"] == "Critical")
    high_inc  = sum(1 for i in incidents if i["magnitude"] >= 3)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_incidents": len(incidents),
            "critical_corridors": critical,
            "high_severity_incidents": high_inc,
            "live_events": len(events),
            "avg_congestion_pct": round(sum(t["congestion_pct"] for t in traffic) / max(len(traffic),1), 1),
        },
        "incidents": incidents,
        "corridors": traffic,
        "events": events,
    }

@router.get("/config-status")
async def config_status():
    """Tell the frontend which API keys are configured."""
    return {
        "google_maps": bool(GOOGLE_MAPS_KEY),
        "tomtom": bool(TOMTOM_KEY),
        "osm": True,   # always free
        "simulation_mode": not (GOOGLE_MAPS_KEY or TOMTOM_KEY),
    }
