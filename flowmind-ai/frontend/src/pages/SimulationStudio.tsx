import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { runPrediction, fetchDiversionRoutes, fetchCausesList } from '../lib/api'
import { Panel, PanelHeader, MetricCard, FormSelect, Btn, ShapBar, RiskBadge, AlertStrip } from '../components/UI'
import { Play, Navigation, Cpu, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

export default function SimulationStudio() {
  const [form, setForm] = useState({
    event_cause: 'public_event',
    crowd_size: 25000,
    time_of_day: 'evening',
    zone_risk: 'medium',
    road_closure: 'partial',
    is_planned: true,
  })
  const [result, setResult] = useState<any>(null)
  const [routes, setRoutes] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [causes, setCauses] = useState<string[]>(['public_event'])

  useEffect(() => { fetchCausesList().then(setCauses).catch(() => {}) }, [])

  const run = async () => {
    setRunning(true)
    try {
      // Step 1: Run ML prediction first so we can pass congestion_score to diversion
      const pred = await runPrediction(form)
      setResult(pred)

      // Step 2: Fetch dynamic diversion routes using the ML congestion score
      const div = await fetchDiversionRoutes({
        latitude: 12.9716,
        longitude: 77.5946,
        event_cause: form.event_cause,
        road_closure: form.road_closure,
        congestion_score: pred.congestion_score ?? 60,
        zone_risk: form.zone_risk,
      })
      setRoutes(div)
    } catch (e) {
      console.error(e)
    }
    setRunning(false)
  }

  const set = (k: string, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }))

  const TT = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="px-3 py-2 rounded-lg border text-xs"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
        <div style={{ color: 'var(--text-muted)' }}>{label}:00</div>
        <div style={{ color: 'var(--cyan)' }}>Congestion: <strong>{payload[0]?.value}%</strong></div>
      </div>
    )
  }

  // Sort SHAP features by value for ranked display
  const shapEntries = result?.feature_importance
    ? Object.entries(result.feature_importance as Record<string, number>)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 8)
    : []

  const maxShap = shapEntries.length > 0 ? (shapEntries[0][1] as number) : 1

  // Dynamic "no AI" values from backend
  const noai = result?.noai_baseline ?? {}
  const withai = result?.with_ai ?? {}

  // Model info badge
  const modelInfo = result?.model_info

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Simulation Studio
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            AI-powered event impact prediction using 8,173 historical Bengaluru events
          </p>
        </div>
        {modelInfo && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px]"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)', color: 'var(--blue)' }}>
            <Cpu size={12} />
            <span>{modelInfo.type} · Agreement {modelInfo.model_agreement_pct}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Form */}
        <Panel>
          <PanelHeader title="Event Parameters" badge="Configure" />
          <div className="p-5 grid grid-cols-2 gap-4">
            <FormSelect label="Event Cause" value={form.event_cause}
              onChange={e => set('event_cause', e.target.value)}>
              {causes.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </FormSelect>

            <FormSelect label="Time of Day" value={form.time_of_day}
              onChange={e => set('time_of_day', e.target.value)}>
              <option value="morning">Morning Peak (7–10am)</option>
              <option value="afternoon">Afternoon (11am–4pm)</option>
              <option value="evening">Evening Peak (5–9pm)</option>
              <option value="night">Night (9pm–6am)</option>
            </FormSelect>

            <FormSelect label="Zone Risk Level" value={form.zone_risk}
              onChange={e => set('zone_risk', e.target.value)}>
              <option value="high">High Risk (Central/North)</option>
              <option value="medium">Medium Risk (West/East)</option>
              <option value="low">Low Risk (South)</option>
            </FormSelect>

            <FormSelect label="Road Closure" value={form.road_closure}
              onChange={e => set('road_closure', e.target.value)}>
              <option value="no">No road closure</option>
              <option value="partial">Partial closure</option>
              <option value="full">Full closure</option>
            </FormSelect>

            <FormSelect label="Event Nature"
              value={form.is_planned ? 'planned' : 'unplanned'}
              onChange={e => set('is_planned', e.target.value === 'planned')}>
              <option value="planned">Planned</option>
              <option value="unplanned">Unplanned</option>
            </FormSelect>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}>
                Expected Crowd: <span style={{ color: 'var(--blue)' }}>{form.crowd_size.toLocaleString()}</span>
              </label>
              <input type="range" min={500} max={150000} step={500} value={form.crowd_size}
                onChange={e => set('crowd_size', +e.target.value)}
                className="w-full" style={{ accentColor: 'var(--blue)' }} />
              <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>500</span><span>150,000</span>
              </div>
            </div>

            <div className="col-span-2">
              <Btn onClick={run} disabled={running} className="w-full justify-center">
                <Play size={14} />
                {running ? 'Running ML Prediction…' : 'Run AI Prediction'}
              </Btn>
            </div>
          </div>
        </Panel>

        {/* Prediction Results */}
        <Panel>
          <PanelHeader
            title="ML Prediction Results"
            badge={result ? result.risk_level : '—'}
            badgeColor={result?.risk_level === 'Critical' ? 'red' : result?.risk_level === 'High' ? 'amber' : 'blue'}
          />
          <div className="p-5">
            {!result
              ? (
                <div className="flex flex-col items-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Play size={32} className="mb-3 opacity-30" />
                  Configure parameters and run simulation
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricCard label="Congestion Score" value={result.congestion_pct} accent={result.risk_color} />
                    <MetricCard label="Impact Radius" value={`${result.affected_radius_km} km`} accent="#F97316" />
                    <MetricCard label="Expected Delay" value={`${result.expected_delay_min} min`} accent="#F59E0B" />
                    <MetricCard label="ML Confidence" value={`${result.confidence_pct}%`} accent="#10B981" />
                  </div>

                  {/* Extra ML metrics */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="px-3 py-2 rounded-lg border text-center"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Closure Prob.</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--amber)' }}>{result.closure_probability_pct}%</div>
                    </div>
                    <div className="px-3 py-2 rounded-lg border text-center"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Hist. Events</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--blue)' }}>{result.historical_events}</div>
                    </div>
                    <div className="px-3 py-2 rounded-lg border text-center"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>High Prio %</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--red)' }}>{result.hist_high_priority_pct}%</div>
                    </div>
                  </div>

                  <div className="text-[11px] mb-3 px-3 py-2 rounded"
                    style={{ background: 'rgba(59,130,246,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                    Peak congestion at <strong style={{ color: 'var(--blue)' }}>{result.peak_hour}</strong>
                    {' · '}Based on <strong>{result.historical_events}</strong> similar incidents
                    {' · '}Avg duration <strong>{result.hist_avg_duration_min} min</strong>
                    {' · '}Hist. closure rate <strong>{result.hist_closure_rate_pct}%</strong>
                  </div>

                  {/* ML 24h forecast — each hour is its own ML prediction */}
                  <div className="text-[10px] mb-1 font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>
                    ML Hourly Congestion Forecast (24h)
                  </div>
                  <div style={{ height: 130 }}>
                    <ResponsiveContainer>
                      <LineChart data={result.hourly_forecast} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={h => `${h}h`} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                        <Tooltip content={<TT />} />
                        <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <ReferenceLine y={55} stroke="#F97316" strokeDasharray="3 3" strokeOpacity={0.4} />
                        <Line type="monotone" dataKey="congestion" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: '#EF4444' }}>— Critical (75+)</span>
                    <span style={{ color: '#F97316' }}>— High (55+)</span>
                  </div>
                </>
              )
            }
          </div>
        </Panel>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* True SHAP feature importance */}
          <Panel>
            <PanelHeader title="Explainable AI — True Feature Impact" badge="SHAP Analysis" badgeColor="blue" />
            <div className="p-5">
              {shapEntries.map(([k, v]: any) => (
                <ShapBar key={k} label={k} value={v} max={maxShap} />
              ))}
              {modelInfo && (
                <div className="mt-3 flex gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span>GBR raw: <strong style={{ color: 'var(--cyan)' }}>{modelInfo.gbr_pred}</strong></span>
                  <span>RF raw: <strong style={{ color: 'var(--blue)' }}>{modelInfo.rfr_pred}</strong></span>
                  <span>Agreement: <strong style={{ color: 'var(--green)' }}>{modelInfo.model_agreement_pct}%</strong></span>
                </div>
              )}
              <div className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Values show each feature's contribution to the ML congestion prediction via permutation importance.
              </div>
            </div>
          </Panel>

          {/* Dynamic diversion routes */}
          <Panel>
            <PanelHeader
              title="Smart Diversion Routes"
              badge={`${routes.filter(r => r.name !== 'No diversion required').length} routes`}
              badgeColor="green"
            />
            <div className="p-5 space-y-3">
              {routes.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: r.recommended ? 'rgba(59,130,246,0.4)' : 'var(--border)',
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--blue)' }}>
                    {r.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{r.name}</span>
                      {r.recommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)' }}>
                          Recommended
                        </span>
                      )}
                      {r.type && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                          {r.type}
                        </span>
                      )}
                    </div>
                    {r.via && <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Via: {r.via}</div>}
                    <div className="text-[11px] mt-1 flex gap-3">
                      {r.time_add_min > 0 && <span style={{ color: 'var(--amber)' }}>+{r.time_add_min} min</span>}
                      <span style={{ color: r.congestion_level === 'Low' ? 'var(--green)' : r.congestion_level === 'High' ? 'var(--red)' : 'var(--amber)' }}>
                        {r.congestion_level} traffic
                      </span>
                      {r.capacity && <span style={{ color: 'var(--text-muted)' }}>Capacity: {r.capacity}</span>}
                    </div>
                  </div>
                  <Navigation size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                </div>
              ))}
              {routes.length === 0 && (
                <div className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Run simulation to generate diversion routes
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* AI vs No AI — fully dynamic from backend */}
      <Panel>
        <PanelHeader
          title="Scenario Comparison — AI Intervention Impact"
          badge="Dynamic from ML + Historical Data"
          badgeColor="blue"
        />
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-bold mb-3 px-3 py-2 rounded flex items-center gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              <TrendingUp size={12} /> Without AI Intervention
            </div>
            {[
              ['Congestion Level',    noai.congestion_pct          ?? '—', 'red'],
              ['Response Time',       noai.response_time_min != null ? `${noai.response_time_min} min` : '—', 'red'],
              ['Road Closures',       noai.road_closure_status     ?? '—', 'red'],
              ['Police Deployed',     noai.police_units != null ? `${noai.police_units} units` : '—', 'red'],
              ['Diversion Routes',    noai.diversion_routes        ?? '—', 'red'],
              ['Incident Duration',   noai.incident_duration_h != null ? `${noai.incident_duration_h} hrs` : '—', 'red'],
            ].map(([l, v, c]) => (
              <div key={l as string} className="flex justify-between py-2 border-b text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span className="font-mono font-bold" style={{ color: `var(--${c})` }}>{v as string}</span>
              </div>
            ))}
            {!result && (
              <div className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Run a simulation to see data-driven baseline values.
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-bold mb-3 px-3 py-2 rounded flex items-center gap-2"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
              <TrendingDown size={12} /> With ASTRA GRID / FlowMind AI
            </div>
            {[
              ['Congestion Level',    withai.congestion_pct       ?? (result ? result.congestion_pct : '—'), 'green'],
              ['Response Time',       withai.response_time_min != null ? `${withai.response_time_min} min` : '—', 'green'],
              ['Road Closures',       withai.road_closure_status  ?? '—', 'green'],
              ['Police Deployed',     withai.police_units != null ? `${withai.police_units} units` : '—', 'green'],
              ['Diversion Routes',    withai.diversion_routes != null ? `${withai.diversion_routes} activated` : '—', 'green'],
              ['Incident Duration',   withai.incident_duration_h != null ? `${withai.incident_duration_h} hrs` : '—', 'green'],
            ].map(([l, v, c]) => (
              <div key={l as string} className="flex justify-between py-2 border-b text-sm"
                style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span className="font-mono font-bold" style={{ color: `var(--${c})` }}>{v as string}</span>
              </div>
            ))}
            {result && (
              <div className="mt-3 text-[11px] px-2 py-1.5 rounded"
                style={{ background: 'rgba(16,185,129,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(16,185,129,0.15)' }}>
                All values derived from ML predictions + {result.historical_events} historical events for "{form.event_cause.replace(/_/g,' ')}".
              </div>
            )}
          </div>
        </div>
      </Panel>
    </div>
  )
}
