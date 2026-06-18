from fastapi import APIRouter
from pydantic import BaseModel
import httpx, os, json
from ml.engine import get_summary_stats, get_zone_risk

router = APIRouter()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

SYSTEM_PROMPT = """You are FlowMind AI Assistant — an expert traffic command intelligence system for Bengaluru, India.

You have access to real event data from the Bengaluru traffic management system (8,173 events, Nov 2023–Apr 2024).

Key dataset facts:
- 8,173 total events tracked (7,706 unplanned, 467 planned)
- Top causes: vehicle_breakdown (4,896), others (638), pot_holes (537), construction (480), water_logging (458), accident (365)
- 1,007 currently active incidents
- 5,030 high-priority events (61.5%)
- 676 road closure events (8.3% rate)
- Peak incident hours: 8pm–10pm (counter-intuitive, not rush hour)
- Top risk zones: Central Zone 2, West Zone 1, North Zone 2
- Top corridors: Mysore Road (743 events), Bellary Road 1 (610), Tumkur Road (458)
- VIP Movement events: highest road closure rate (~80%)

Your role: Help traffic authorities predict congestion, plan resources, suggest diversions, and interpret data.
Be concise, data-driven, and professional. Use specific numbers from the dataset when relevant.
Always respond in under 200 words unless a detailed breakdown is specifically requested."""

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/chat")
async def chat(req: ChatRequest):
    if not ANTHROPIC_API_KEY:
        return {"reply": "⚠️ Set ANTHROPIC_API_KEY in your .env file to enable the AI Assistant."}

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
                    "system": SYSTEM_PROMPT,
                    "messages": messages,
                },
            )
        data = resp.json()
        reply = data["content"][0]["text"] if "content" in data else "Error from AI service."
        return {"reply": reply}
    except Exception as e:
        return {"reply": f"Connection error: {str(e)}"}
