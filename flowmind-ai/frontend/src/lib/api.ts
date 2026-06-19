import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  timeout: 15000
})

export const fetchSummary = () => api.get('/analytics/summary').then(r => r.data)
export const fetchCauses = () => api.get('/analytics/cause-distribution').then(r => r.data)
export const fetchMonthly = () => api.get('/analytics/monthly-trend').then(r => r.data)
export const fetchHourly = () => api.get('/analytics/hourly-pattern').then(r => r.data)
export const fetchZoneRisk = () => api.get('/analytics/zone-risk').then(r => r.data)
export const fetchCorridors = () => api.get('/analytics/corridor-stats').then(r => r.data)
export const fetchPoliceStations = () => api.get('/analytics/police-stations').then(r => r.data)
export const fetchClosureByCause = () => api.get('/analytics/closure-by-cause').then(r => r.data)
export const fetchHeatmap = (limit = 500) => api.get(`/analytics/heatmap?limit=${limit}`).then(r => r.data)
export const fetchRecentEvents = (limit = 20) => api.get(`/analytics/recent-events?limit=${limit}`).then(r => r.data)
export const fetchPulse = () => api.get('/realtime/pulse').then(r => r.data)
export const fetchAlerts = () => api.get('/realtime/alerts').then(r => r.data)
export const fetchEvents = (params?: Record<string, string | number>) =>
  api.get('/events/list', { params }).then(r => r.data)

export const runPrediction = (body: Record<string, unknown>) =>
  api.post('/predictions/predict', body).then(r => r.data)
export const fetchCausesList = () => api.get('/predictions/causes').then(r => r.data)

export const recommendResources = (body: Record<string, unknown>) =>
  api.post('/resources/recommend', body).then(r => r.data)

export const fetchDiversionRoutes = (body: Record<string, unknown>) =>
  api.post('/diversion/routes', body).then(r => r.data)

export const sendChatMessage = (message: string, history: { role: string; content: string }[]) =>
  api.post('/assistant/chat', { message, history }).then(r => r.data)



// ── Live Data ──────────────────────────────────────────────────────────────
export const fetchLiveSnapshot    = () => api.get('/live/live-snapshot').then(r => r.data)
export const fetchLiveIncidents   = () => api.get('/live/traffic-incidents').then(r => r.data)
export const fetchLiveTraffic     = () => api.get('/live/google-traffic').then(r => r.data)
export const fetchLiveEvents      = () => api.get('/live/live-events').then(r => r.data)
export const fetchApiConfigStatus = () => api.get('/live/config-status').then(r => r.data)

export default api