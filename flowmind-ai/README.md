# 🚦 FlowMind AI — ASTRA GRID v2.0
### Intelligent Event Traffic Command Center for Bengaluru

> **Predict. Prepare. Prevent.**
> Real-time AI-powered traffic intelligence platform built on 8,173 actual Bengaluru event records.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Quick Setup (Step-by-Step)](#quick-setup)
6. [Running the Application](#running-the-application)
7. [All 8 Pages Explained](#all-8-pages)
8. [API Reference](#api-reference)
9. [Dataset Details](#dataset-details)
10. [AI & ML Engine](#ai--ml-engine)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Project Structure](#project-structure)

---

## Project Overview

FlowMind AI (ASTRA GRID v2.0) solves a real urban problem:

**The Problem:** Traffic authorities in Bengaluru have no system to quantify event impact before it happens, deploy resources based on data, or learn from past incidents.

**The Solution:** An end-to-end AI platform that:
- Analyzes 8,173 historical Bengaluru traffic events
- Predicts congestion severity for any planned/unplanned event
- Recommends exact manpower and barricade deployment
- Generates optimized diversion routes
- Provides an explainable AI layer (SHAP attribution)
- Runs a Claude-powered intelligent assistant with dataset grounding

---

## Features

| Feature | Description |
|---------|-------------|
| 📊 Command Center | Live KPIs, alerts, incident feed, zone risk table |
| 🗺️ City Map | Leaflet heatmap + marker view with cause/status filters |
| ⚡ Simulation Studio | Predict impact of any event configuration |
| 👮 Resource Planner | AI-optimized officer/barricade deployment |
| 📈 Analytics | 10+ charts: causes, monthly trend, hourly pattern, zones, corridors |
| 💬 AI Assistant | Claude-powered chat grounded in real Bengaluru data |
| 🧠 Explainable AI | SHAP feature attribution + model decision path |
| ↔️ Scenario Compare | Side-by-side radar comparison of two scenarios |

---

## Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **Recharts** (charts)
- **Leaflet + React-Leaflet** (interactive map)
- **Axios** (API client)
- **React Router v6** (routing)

### Backend
- **FastAPI** (Python 3.11+)
- **Pandas + NumPy** (data processing)
- **httpx** (async HTTP for Claude API)
- **Uvicorn** (ASGI server)

### AI/ML
- **Custom ML engine** built on Bengaluru dataset patterns
- **SHAP-style feature attribution** (XGBoost-inspired scoring)
- **Claude AI (claude-sonnet-4-6)** for the intelligent assistant
- **OR-Tools-style resource optimizer** (heuristic implementation)
- **NetworkX-style route planner** (Bengaluru road knowledge base)

### Data
- **8,173 Bengaluru traffic events** (Nov 2023 – Apr 2024)
- Covers planned + unplanned events, police stations, zones, corridors

---

## Prerequisites

Install these before starting:

### 1. Python 3.11+
```bash
# Check version
python3 --version

# Install on Ubuntu/Debian
sudo apt update && sudo apt install python3.11 python3.11-venv python3-pip

# Install on macOS (using Homebrew)
brew install python@3.11

# Windows: Download from https://python.org (check "Add to PATH")
```

### 2. Node.js 18+
```bash
# Check version
node --version

# Install on Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs

# macOS
brew install node

# Windows: Download from https://nodejs.org
```

### 3. Git
```bash
git --version
# Install: https://git-scm.com/downloads
```

---

## Quick Setup

### Step 1 — Extract the ZIP

```bash
unzip flowmind-ai.zip
cd flowmind-ai
```

You should see this structure:
```
flowmind-ai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── ml/
│   │   └── engine.py
│   └── routers/
│       ├── analytics.py
│       ├── predictions.py
│       ├── resources.py
│       ├── events.py
│       ├── diversion.py
│       ├── realtime.py
│       └── assistant.py
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── lib/api.ts
│       ├── components/
│       │   ├── UI.tsx
│       │   ├── Sidebar.tsx
│       │   └── Topbar.tsx
│       └── pages/
│           ├── CommandCenter.tsx
│           ├── CityMap.tsx
│           ├── SimulationStudio.tsx
│           ├── ResourcePlanner.tsx
│           ├── Analytics.tsx
│           ├── Assistant.tsx
│           ├── XAI.tsx
│           └── Compare.tsx
└── data/
    └── astram_events.csv
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi-0.111.0 uvicorn-0.29.0 pandas-2.2.2 ...
```

---

### Step 3 — Configure Environment (Anthropic API Key)

The AI Assistant requires an Anthropic API key. All other features (charts, predictions, maps) work WITHOUT it.

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your key
nano .env          # Linux/macOS
notepad .env       # Windows
```

Contents of `.env`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx
```

**Get your API key:** https://console.anthropic.com/

> ⚠️ If you skip this step, the AI Assistant page will show a warning message but everything else works normally.

---

### Step 4 — Frontend Setup

```bash
# Open a NEW terminal window
cd flowmind-ai/frontend

# Install dependencies (takes 1-2 minutes)
npm install
```

**Expected output:**
```
added 847 packages, and audited 848 packages in 45s
```

---

## Running the Application

You need **two terminals running simultaneously**.

### Terminal 1 — Start Backend

```bash
cd flowmind-ai/backend
source venv/bin/activate    # Linux/macOS
# OR: venv\Scripts\activate  # Windows

# Load env and start server
export $(cat .env | xargs)   # Linux/macOS
# OR on Windows PowerShell:
# Get-Content .env | ForEach-Object { $name, $value = $_ -split '=', 2; Set-Item "env:$name" $value }

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

Test it: Open http://localhost:8000 → should show `{"message":"FlowMind AI API v2.0..."}`

### Terminal 2 — Start Frontend

```bash
cd flowmind-ai/frontend
npm run dev
```

**You should see:**
```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

### Open the App

Navigate to: **http://localhost:3000**

The app will load and immediately begin fetching data from the backend (which reads the CSV dataset).

---

## All 8 Pages

### 1. Command Center (`/`)
The main dashboard. Shows:
- 4 KPI cards: Total Events, Active, High Priority, Road Closures
- Live alerts panel (updates every 30s)
- Event cause pie chart
- Monthly trend bar chart
- Zone risk table with scores
- Active incidents feed
- Hourly incident pattern with insight callout
- Top police station load
- Road closure rate by cause

### 2. City Map (`/map`)
Interactive Leaflet map centered on Bengaluru.
- **Heatmap mode**: Intensity overlay of all 8,173 event locations
- **Markers mode**: Colored dots per event cause with popups
- Filter by event cause
- Risk level legend
- Live incident sidebar
- CartoDB Dark basemap

### 3. Simulation Studio (`/simulation`)
Configure any event scenario and get AI predictions:
- Dropdowns: cause, time of day, zone risk, road closure type
- Slider: crowd size (500–150,000)
- Outputs: risk level, congestion %, affected radius, delay, peak hour
- 24-hour congestion forecast chart
- SHAP feature importance bars
- Smart diversion routes
- AI vs No-AI comparison table

### 4. Resource Planner (`/resources`)
AI resource deployment recommendations:
- Same form as Simulation Studio
- Outputs: Officers, Barricades, Vehicles, Emergency Teams, Drones
- Deployment zone breakdown chart (Primary/Secondary/Diversion)
- AI reasoning text
- Emergency access plan (ambulance, fire, protocol)

### 5. Analytics (`/analytics`)
10+ deep-dive charts:
- Summary stats (planned vs unplanned, avg duration, closure rate)
- Horizontal bar: top causes by volume
- Line: monthly event trend
- Bar: 24-hour incident pattern with color coding
- Radar: zone risk multi-dimension
- Grouped bar: top corridors (events + closures)
- Horizontal bar: closure rate by cause
- Full table: all police stations with load bars

### 6. AI Assistant (`/assistant`)
Claude-powered chat:
- Grounded in real Bengaluru dataset statistics
- Quick question buttons
- Dataset facts panel
- Full conversation history maintained in session
- Requires ANTHROPIC_API_KEY in backend/.env

### 7. Explainable AI (`/xai`)
Model transparency page:
- Model architecture cards (XGBoost, Random Forest, OR-Tools)
- SHAP bar chart with natural language explanation
- 24-hour color-coded forecast
- 4-step model decision path walkthrough
- Confidence score display

### 8. Scenario Compare (`/compare`)
Side-by-side scenario analysis:
- Two independent scenario forms
- Run both simultaneously
- Radar chart overlay
- Head-to-head comparison table
- AI recommendation on which scenario is higher risk

---

## API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | KPI summary stats |
| GET | `/api/analytics/cause-distribution` | Event counts by cause |
| GET | `/api/analytics/monthly-trend` | Monthly event volumes |
| GET | `/api/analytics/hourly-pattern` | 24-hour incident pattern |
| GET | `/api/analytics/zone-risk` | Zone risk scores |
| GET | `/api/analytics/corridor-stats` | Corridor event counts |
| GET | `/api/analytics/police-stations` | Station load data |
| GET | `/api/analytics/closure-by-cause` | Road closure rates |
| GET | `/api/analytics/heatmap?limit=500` | Lat/lng points for heatmap |
| GET | `/api/analytics/recent-events?limit=20` | Latest incidents |
| GET | `/api/realtime/pulse` | Live system pulse |
| GET | `/api/realtime/alerts` | System alerts |
| GET | `/api/events/list` | Paginated event list |
| POST | `/api/predictions/predict` | Run AI prediction |
| POST | `/api/resources/recommend` | Get resource plan |
| POST | `/api/diversion/routes` | Get diversion routes |
| POST | `/api/assistant/chat` | Chat with AI assistant |

**Interactive API Docs:** http://localhost:8000/docs (Swagger UI)

---

## Dataset Details

File: `data/astram_events.csv`

| Metric | Value |
|--------|-------|
| Total records | 8,173 |
| Date range | Nov 2023 – Apr 2024 |
| Planned events | 467 (5.7%) |
| Unplanned events | 7,706 (94.3%) |
| Active events | 1,007 |
| High priority | 5,030 (61.5%) |
| Road closures | 676 (8.3%) |
| Peak incident hour | 8–10pm |

**Top Causes:**
1. vehicle_breakdown — 4,896
2. others — 638
3. pot_holes — 537
4. construction — 480
5. water_logging — 458
6. accident — 365
7. congestion — 245

**Top Corridors:** Mysore Road (743), Bellary Road 1 (610), Tumkur Road (458)

**Key Insight:** Peak incidents are at 8–10pm, NOT during morning rush hour. VIP movements carry ~80% road closure rate.

---

## AI & ML Engine

The ML engine (`backend/ml/engine.py`) implements:

### Impact Prediction
1. **Historical baseline**: Queries matching events from dataset for base risk
2. **Feature multiplication**: Crowd size × time-of-day × zone × road closure × plan status
3. **Evidence blending**: Mixes model output with historical patterns (weighted by dataset confidence)
4. **Risk classification**: Maps 0–100 score to Low/Moderate/High/Critical

### Resource Recommendation
- Base officer count per event type (from dataset patterns)
- Scales with risk level, zone risk, and crowd factor
- Adds road closure multiplier

### SHAP Attribution
Simplified Shapley values showing each feature's relative contribution to the final score, enabling explainability.

### Diversion Routes
Bengaluru-specific route knowledge base (ORR, NICE Road, Bellary Road, Mysore Road Bypass, etc.) with congestion level estimates.

---

## Deployment

### Deploy to Railway + Vercel (Free Tier)

#### Backend → Railway
1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repo, choose `/backend` as root directory
4. Add environment variable: `ANTHROPIC_API_KEY=your_key`
5. Railway auto-detects `requirements.txt` and deploys
6. Note your Railway URL (e.g. `https://flowmind-backend.railway.app`)

#### Frontend → Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "New Project" → import repo
3. Set root directory to `/frontend`
4. Add environment variable: `VITE_API_URL=https://flowmind-backend.railway.app`
5. Update `frontend/src/lib/api.ts` line 3:
   ```ts
   const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
   ```
6. Deploy

#### Database (Optional)
For production persistence, connect MongoDB Atlas:
1. Create free cluster at https://www.mongodb.com/atlas
2. Add `MONGODB_URI` to Railway environment variables
3. Extend backend models to persist events and feedback

---

## Troubleshooting

### ❌ "Module not found" on backend start
```bash
# Make sure venv is activated
source venv/bin/activate
pip install -r requirements.txt
```

### ❌ "CORS error" in browser console
The backend has CORS enabled for all origins. If you're still seeing this:
- Make sure backend is running on port 8000
- Make sure Vite proxy is configured (it is, in vite.config.ts)

### ❌ Map doesn't load
Leaflet requires the CSS to be loaded. Check that `index.html` has:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```
Also, the heatmap plugin requires `leaflet.heat`. The City Map page gracefully degrades if it's not available — use Markers mode instead.

### ❌ AI Assistant shows "Set ANTHROPIC_API_KEY"
1. Create `backend/.env` with your key
2. Restart the backend server
3. On macOS/Linux: `export $(cat .env | xargs) && python -m uvicorn main:app --reload`

### ❌ CSV not found error
Make sure `data/astram_events.csv` exists. The ML engine path is relative to `backend/main.py`. If you move files, update the `DATA_PATH` in `backend/ml/engine.py`:
```python
DATA_PATH = Path("/absolute/path/to/astram_events.csv")
```

### ❌ Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9   # Linux/macOS
netstat -ano | findstr :8000     # Windows (find PID then: taskkill /PID <pid> /F)

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### ❌ Slow initial load
The first API call loads and processes the entire 8,173-row CSV. This takes ~2-3 seconds. Subsequent calls use the cached DataFrame and are instant.

---

## Project Structure

```
flowmind-ai/
│
├── README.md                    ← You are here
│
├── data/
│   └── astram_events.csv        ← Bengaluru event dataset (8,173 rows)
│
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt         ← Python dependencies
│   ├── .env.example             ← Copy to .env, add API key
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   └── engine.py            ← Core ML: prediction, resources, analytics
│   │
│   └── routers/
│       ├── __init__.py
│       ├── analytics.py         ← /api/analytics/* endpoints
│       ├── predictions.py       ← /api/predictions/* endpoints
│       ├── resources.py         ← /api/resources/* endpoints
│       ├── events.py            ← /api/events/* endpoints
│       ├── diversion.py         ← /api/diversion/* endpoints
│       ├── realtime.py          ← /api/realtime/* endpoints
│       └── assistant.py         ← /api/assistant/* (Claude AI chat)
│
└── frontend/
    ├── index.html               ← HTML entry + Leaflet CSS import
    ├── package.json             ← npm dependencies
    ├── vite.config.ts           ← Vite + proxy config
    ├── tailwind.config.js       ← Dark theme color tokens
    ├── tsconfig.json
    │
    └── src/
        ├── main.tsx             ← React entry point
        ├── App.tsx              ← Router + layout
        ├── index.css            ← Global styles + CSS variables
        │
        ├── lib/
        │   └── api.ts           ← All API calls (axios)
        │
        ├── components/
        │   ├── UI.tsx           ← Shared components (Panel, Card, Badge...)
        │   ├── Sidebar.tsx      ← Collapsible nav sidebar
        │   └── Topbar.tsx       ← Header with live clock
        │
        └── pages/
            ├── CommandCenter.tsx    ← Main dashboard
            ├── CityMap.tsx          ← Leaflet heatmap/marker map
            ├── SimulationStudio.tsx ← Event simulator + AI prediction
            ├── ResourcePlanner.tsx  ← AI resource optimization
            ├── Analytics.tsx        ← 10+ deep analytics charts
            ├── Assistant.tsx        ← Claude AI chat
            ├── XAI.tsx              ← Explainable AI / SHAP
            └── Compare.tsx          ← Side-by-side scenario comparison
```

---

## Team Allocation

| Member | Responsibility |
|--------|---------------|
| Member 1 | Frontend (React, Tailwind, Recharts, all 8 pages) |
| Member 2 | Backend (FastAPI, routers, data layer) |
| Member 3 | ML Engine (prediction, SHAP, resource optimizer) |
| Member 4 | Maps (Leaflet, heatmap), Deployment (Vercel, Railway) |

---

## License

Built for Gridlock 2.0 Hackathon — ASTRA GRID Challenge.
Dataset provided by HackerEarth / Bengaluru Traffic Authority.

---

*FlowMind AI — Predict. Prepare. Prevent.* 🚦
