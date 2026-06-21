from dotenv import load_dotenv
load_dotenv()
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import events, predictions, resources, analytics, diversion, realtime, assistant, livedata
import uvicorn
 
app = FastAPI(
    title="FlowMind AI — Traffic Command API",
    description="Intelligent Event Traffic Command Center for Bengaluru",
    version="2.0.0"
)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(resources.router, prefix="/api/resources", tags=["Resources"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(diversion.router, prefix="/api/diversion", tags=["Diversion"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Realtime"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])
app.include_router(livedata.router, prefix="/api/live", tags=["Live Data"])
 
@app.get("/")
async def root():
    return {"message": "FlowMind AI API v2.0 — Traffic Command Center", "status": "operational"}
 
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "FlowMind AI"}
 
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)