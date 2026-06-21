from fastapi import APIRouter
from pydantic import BaseModel
import httpx, os, json
from ml.engine import get_summary_stats, get_zone_risk, get_cause_distribution, get_closure_by_cause

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")


def build_system_prompt() -> str:
    """
    Build the assistant's context from the live ML engine on every request,
    rather than a hardcoded snapshot of numbers that drifts out of date the
    moment the dataset changes. All facts below are computed fresh from the
    trained model / dataset, not typed in by hand.
    """
    stats   = get_summary_stats()
    causes  = get_cause_distribution()[:6]
    zones   = get_zone_risk()[:3]
    closure = get_closure_by_cause()
    top_closure = closure[0] if closure else None

    causes_str = ", ".join(f"{c['cause']} ({c['count']})" for c in causes)
    zones_str  = ", ".join(z["name"] for z in zones)

    return f"""You are FlowMind AI Assistant — an expert traffic command intelligence system for Bengaluru, India.

You have access to real event data from the Bengaluru traffic management system, computed live from the trained ML engine on every request:

Live dataset facts:
- {stats['total_events']:,} total events tracked ({stats['planned_events']:,} planned, {stats['unplanned_events']:,} unplanned)
- Top causes: {causes_str}
- {stats['active_events']:,} currently active incidents
- {stats['high_priority']:,} high-priority events ({stats['high_priority']/max(stats['total_events'],1)*100:.1f}%)
- {stats['road_closures']:,} road closure events ({stats['closure_rate_pct']}% rate)
- Average incident duration: {stats['avg_duration_min']} minutes
- Top risk zones: {zones_str}
- Highest closure-rate cause: {top_closure['cause'] if top_closure else 'n/a'} ({top_closure['closure_rate'] if top_closure else '–'}% closure rate)

Your role: Help traffic authorities predict congestion, plan resources, suggest diversions, and interpret data.
Be concise, data-driven, and professional. Use specific numbers from the dataset when relevant.
Always respond in under 200 words unless a detailed breakdown is specifically requested."""

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/chat")
async def chat(req: ChatRequest):
    if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY.startswith("your_"):
        return {"reply": "⚠️ Set a real ANTHROPIC_API_KEY in your .env file to enable the AI Assistant."}

    messages = []
    for h in req.history[-6:]:  # last 3 exchanges
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 512,
                    "system": build_system_prompt(),
                    "messages": messages,
                },
            )
        data = resp.json()
        if "content" in data:
            reply = data["content"][0]["text"]
        else:
            err = data.get("error", {}).get("message", f"HTTP {resp.status_code}")
            reply = f"⚠️ AI service error: {err}"
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"⚠️ Connection error: {str(e)}"}
