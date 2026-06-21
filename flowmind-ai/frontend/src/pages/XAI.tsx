import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { runPrediction, fetchCausesList } from '../lib/api'
import { Panel, PanelHeader, FormSelect, Btn, ShapBar } from '../components/UI'
import { HelpCircle, Cpu } from 'lucide-react'

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      <div style={{ color: 'var(--text-muted)' }}>{label}:00</div>
      <div style={{ color: 'var(--cyan)' }}>Congestion: <strong>{payload[0]?.value}%</strong></div>
    </div>
  )
}

export default function XAI() {
  const [form, setForm] = useState({ event_cause: 'vip_movement', crowd_size: 30000, time_of_day: 'evening', zone_risk: 'high', road_closure: 'full', is_planned: true })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [causes, setCauses] = useState<string[]>(['vip_movement'])
  const set = (k: string, v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { fetchCausesList().then(setCauses).catch(() => {}) }, [])

  const run = async () => {
    setLoading(true)
    try { const r = await runPrediction(form); setResult(r) } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div className="flex items-center gap-3">
        <HelpCircle size={20} style={{ color: 'var(--blue)' }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Explainable AI (XAI)</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Understand exactly why FlowMind AI makes each prediction</p>
        </div>
      </div>

      {/* Model Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { name: 'XGBoost', use: 'Congestion Severity · Impact Score', icon: '⚡', color: '#3B82F6' },
          { name: 'Random Forest', use: 'Delay Estimation · Risk Classification', icon: '🌲', color: '#10B981' },
          { name: 'OR-Tools', use: 'Resource Optimization · Manpower Allocation', icon: '🔧', color: '#8B5CF6' },
        ].map(m => (
          <div key={m.name} className="p-4 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="font-semibold text-sm mb-1" style={{ color: m.color }}>{m.name}</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.use}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Controls */}
        <Panel>
          <PanelHeader title="Simulate Scenario" badge="XAI" badgeColor="blue" />
          <div className="p-5 space-y-4">
            <FormSelect label="Event Cause" value={form.event_cause} onChange={e => set('event_cause', e.target.value)}>
              {causes.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </FormSelect>
            <FormSelect label="Time of Day" value={form.time_of_day} onChange={e => set('time_of_day', e.target.value)}>
              <option value="morning">Morning Peak (7–10am)</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening Peak (5–9pm)</option>
              <option value="night">Night</option>
            </FormSelect>
            <FormSelect label="Zone Risk" value={form.zone_risk} onChange={e => set('zone_risk', e.target.value)}>
              <option value="high">High Risk Zone</option>
              <option value="medium">Medium Risk Zone</option>
              <option value="low">Low Risk Zone</option>
            </FormSelect>
            <FormSelect label="Road Closure" value={form.road_closure} onChange={e => set('road_closure', e.target.value)}>
              <option value="no">No closure</option>
              <option value="partial">Partial</option>
              <option value="full">Full closure</option>
            </FormSelect>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                Crowd: <span style={{ color: 'var(--blue)' }}>{form.crowd_size.toLocaleString()}</span>
              </label>
              <input type="range" min={500} max={150000} step={500} value={form.crowd_size}
                onChange={e => set('crowd_size', +e.target.value)} style={{ accentColor: 'var(--blue)', width: '100%' }} />
            </div>
            <Btn onClick={run} disabled={loading} className="w-full justify-center">
              <Cpu size={14} /> {loading ? 'Analyzing…' : 'Run XAI Analysis'}
            </Btn>
          </div>
        </Panel>

        {/* XAI Results */}
        <div className="lg:col-span-2 space-y-4">
          {!result
            ? (
              <Panel>
                <div className="flex flex-col items-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <HelpCircle size={40} className="mb-4 opacity-20" />
                  Configure parameters and run XAI analysis to see feature attribution
                </div>
              </Panel>
            )
            : (
              <>
                {/* Score Card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border text-center" style={{ background: 'var(--bg-card)', borderColor: result.risk_color + '40' }}>
                    <div className="text-3xl font-bold font-mono" style={{ color: result.risk_color }}>{result.congestion_pct}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Congestion Score</div>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{result.risk_level}</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Risk Level</div>
                  </div>
                  <div className="p-4 rounded-xl border text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="text-3xl font-bold font-mono" style={{ color: '#10B981' }}>{result.confidence_pct}%</div>
                    <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>Model Confidence</div>
                  </div>
                </div>

                {/* SHAP */}
                <Panel>
                  <PanelHeader title="SHAP Feature Attribution" badge="Why this prediction?" badgeColor="blue" />
                  <div className="p-5">
                    <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                      SHAP (SHapley Additive exPlanations) shows each feature's contribution to the final congestion score.
                      Longer bars = greater influence on the prediction.
                    </div>
                    {Object.entries(result.feature_importance).map(([k, v]: any) => (
                      <ShapBar key={k} label={k} value={v} max={35} />
                    ))}

                    {/* Natural language explanation */}
                    {(() => {
                      const entries = Object.entries(result.feature_importance) as [string, number][]
                      const [topFeature, topValue] = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0] || ['', 0])
                      return (
                        <div className="mt-5 p-4 rounded-lg border" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
                          <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--blue)' }}>📊 AI Explanation</div>
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{topFeature}</strong> is the dominant factor for this prediction, contributing
                            {' '}<strong style={{ color: 'var(--blue)' }}>{topValue}%</strong> of the model's decision weight toward the
                            {' '}<strong style={{ color: result.risk_color }}>{result.risk_level}</strong> risk classification.
                            Historical data shows <strong style={{ color: 'var(--text-primary)' }}>{result.hist_closure_rate_pct}%</strong> of {form.event_cause.replace(/_/g,' ')} events
                            require road closure, informing the resource recommendation.
                            Based on <strong style={{ color: 'var(--blue)' }}>{result.historical_events}</strong> similar past incidents in Bengaluru,
                            with the ensemble's two models agreeing <strong style={{ color: 'var(--text-primary)' }}>{result.model_info?.model_agreement_pct}%</strong> of the time.
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </Panel>

                {/* Hourly forecast */}
                <Panel>
                  <PanelHeader title="24-Hour Congestion Forecast" badge="Time Series" />
                  <div className="p-4" style={{ height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={result.hourly_forecast} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={h => `${h}h`} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                        <Tooltip content={<TT />} />
                        <Bar dataKey="congestion" name="Congestion %" radius={[2,2,0,0]}>
                          {result.hourly_forecast.map((d: any, i: number) => (
                            <Cell key={i} fill={d.congestion >= 70 ? '#EF4444' : d.congestion >= 50 ? '#F97316' : d.congestion >= 30 ? '#F59E0B' : '#3B82F6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                {/* How it works */}
                <Panel>
                  <PanelHeader title="Model Decision Path" badge="Transparent AI" badgeColor="green" />
                  <div className="p-5">
                    <div className="space-y-3">
                      {[
                        { step: '1', title: 'Historical Baseline', desc: `FlowMind queries ${result.historical_events} matching ${form.event_cause.replace(/_/g,' ')} incidents from the Bengaluru dataset and extracts a base risk score.` },
                        { step: '2', title: 'Feature Engineering', desc: 'Crowd size, time-of-day, zone risk, and road closure type are encoded and passed through XGBoost\'s gradient-boosted decision trees.' },
                        { step: '3', title: 'Evidence Blending', desc: `Dataset evidence weight: ${Math.min(Math.round(result.historical_events / 200 * 40), 40)}%. The model blends XGBoost prediction with historical closure rate (${result.hist_closure_rate_pct}%) for calibrated output.` },
                        { step: '4', title: 'Risk Classification', desc: `Final score ${result.congestion_score}/100 maps to "${result.risk_level}" via Random Forest risk classifier trained on Bengaluru incident outcomes.` },
                      ].map(s => (
                        <div key={s.step} className="flex gap-4">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.3)' }}>{s.step}</div>
                          <div>
                            <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.title}</div>
                            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Panel>
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}
