import React, { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { runPrediction, fetchCausesList } from '../lib/api'
import { Panel, PanelHeader, FormSelect, Btn } from '../components/UI'
import { GitCompare, Play } from 'lucide-react'

const DEFAULT_A = { event_cause: 'public_event', crowd_size: 30000, time_of_day: 'evening', zone_risk: 'high', road_closure: 'partial', is_planned: true }
const DEFAULT_B = { event_cause: 'vip_movement', crowd_size: 5000, time_of_day: 'morning', zone_risk: 'medium', road_closure: 'full', is_planned: true }

const ScenarioForm = ({ label, form, setForm, color, causes }: any) => {
  const set = (k: string, v: string | number | boolean) => setForm((f: any) => ({ ...f, [k]: v }))
  return (
    <Panel>
      <PanelHeader title={`Scenario ${label}`} badge={label} badgeColor={label === 'A' ? 'blue' : 'amber'} />
      <div className="p-5 space-y-3">
        <FormSelect label="Event Cause" value={form.event_cause} onChange={(e: any) => set('event_cause', e.target.value)}>
          {causes.map((c: string) => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
        </FormSelect>
        <FormSelect label="Time of Day" value={form.time_of_day} onChange={(e: any) => set('time_of_day', e.target.value)}>
          <option value="morning">Morning Peak (7–10am)</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening Peak (5–9pm)</option>
          <option value="night">Night</option>
        </FormSelect>
        <FormSelect label="Zone Risk" value={form.zone_risk} onChange={(e: any) => set('zone_risk', e.target.value)}>
          <option value="high">High Risk Zone</option>
          <option value="medium">Medium Risk Zone</option>
          <option value="low">Low Risk Zone</option>
        </FormSelect>
        <FormSelect label="Road Closure" value={form.road_closure} onChange={(e: any) => set('road_closure', e.target.value)}>
          <option value="no">No closure</option>
          <option value="partial">Partial</option>
          <option value="full">Full closure</option>
        </FormSelect>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
            Crowd: <span style={{ color }}>{form.crowd_size.toLocaleString()}</span>
          </label>
          <input type="range" min={500} max={150000} step={500} value={form.crowd_size}
            onChange={e => set('crowd_size', +e.target.value)} style={{ accentColor: color, width: '100%' }} />
        </div>
      </div>
    </Panel>
  )
}

const LABELS: Record<string, string> = {
  vehicle_breakdown:'Vehicle Breakdown', accident:'Accident', public_event:'Public Event',
  procession:'Procession', vip_movement:'VIP Movement', construction:'Construction',
  water_logging:'Water Logging', pot_holes:'Pot Holes', congestion:'Congestion',
  protest:'Protest', others:'Others'
}

export default function Compare() {
  const [formA, setFormA] = useState<any>(DEFAULT_A)
  const [formB, setFormB] = useState<any>(DEFAULT_B)
  const [resultA, setResultA] = useState<any>(null)
  const [resultB, setResultB] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [causes, setCauses] = useState<string[]>(['public_event', 'vip_movement'])

  useEffect(() => { fetchCausesList().then(setCauses).catch(() => {}) }, [])

  const run = async () => {
    setLoading(true)
    try {
      const [a, b] = await Promise.all([runPrediction(formA), runPrediction(formB)])
      setResultA(a); setResultB(b)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const radarData = resultA && resultB ? [
    { metric: 'Congestion', A: resultA.congestion_score, B: resultB.congestion_score },
    { metric: 'Delay (×)', A: resultA.expected_delay_min, B: resultB.expected_delay_min },
    { metric: 'Radius', A: resultA.affected_radius_km * 10, B: resultB.affected_radius_km * 10 },
    { metric: 'Confidence', A: resultA.confidence_pct, B: resultB.confidence_pct },
    { metric: 'Hist Events', A: Math.min(resultA.historical_events / 50, 100), B: Math.min(resultB.historical_events / 50, 100) },
  ] : []

  const metrics = [
    { key: 'Risk Level', a: resultA?.risk_level, b: resultB?.risk_level },
    { key: 'Congestion', a: resultA?.congestion_pct, b: resultB?.congestion_pct },
    { key: 'Affected Radius', a: resultA ? `${resultA.affected_radius_km} km` : '—', b: resultB ? `${resultB.affected_radius_km} km` : '—' },
    { key: 'Expected Delay', a: resultA ? `${resultA.expected_delay_min} min` : '—', b: resultB ? `${resultB.expected_delay_min} min` : '—' },
    { key: 'Peak Hour', a: resultA?.peak_hour, b: resultB?.peak_hour },
    { key: 'Historical Events', a: resultA?.historical_events, b: resultB?.historical_events },
    { key: 'Model Confidence', a: resultA ? `${resultA.confidence_pct}%` : '—', b: resultB ? `${resultB.confidence_pct}%` : '—' },
    { key: 'Hist Closure Rate', a: resultA ? `${resultA.hist_closure_rate_pct}%` : '—', b: resultB ? `${resultB.hist_closure_rate_pct}%` : '—' },
  ]

  const RISK_ORDER = ['Low','Moderate','High','Critical']
  const winner = (keyA: string, keyB: string) => {
    if (!resultA || !resultB) return null
    const scoreA = resultA.congestion_score, scoreB = resultB.congestion_score
    return scoreA < scoreB ? 'A' : scoreA > scoreB ? 'B' : null
  }

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div className="flex items-center gap-3">
        <GitCompare size={20} style={{ color: 'var(--blue)' }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Scenario Comparator</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Compare two event scenarios head-to-head with AI predictions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScenarioForm label="A" form={formA} setForm={setFormA} color="var(--blue)" causes={causes} />
        <ScenarioForm label="B" form={formB} setForm={setFormB} color="var(--amber)" causes={causes} />
      </div>

      <Btn onClick={run} disabled={loading} className="w-full justify-center">
        <Play size={14} />
        {loading ? 'Comparing Scenarios…' : 'Compare Scenarios with AI'}
      </Btn>

      {resultA && resultB && (
        <>
          {/* Radar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel>
              <PanelHeader title="Multi-Dimension Radar" badge="AI Score" badgeColor="blue" />
              <div className="p-4" style={{ height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(59,130,246,0.15)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                    <Radar name="Scenario A" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} />
                    <Radar name="Scenario B" dataKey="B" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.10} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Comparison table */}
            <Panel>
              <PanelHeader title="Head-to-Head Comparison" />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Metric</th>
                      <th className="px-4 py-2 text-center text-[10px] uppercase tracking-wider" style={{ color: '#3B82F6' }}>Scenario A</th>
                      <th className="px-4 py-2 text-center text-[10px] uppercase tracking-wider" style={{ color: '#F59E0B' }}>Scenario B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, i) => {
                      const aScore = resultA.congestion_score, bScore = resultB.congestion_score
                      const aIsWorse = m.key === 'Risk Level' || m.key === 'Congestion' || m.key === 'Expected Delay'
                      return (
                        <tr key={i} className="border-b" style={{ borderColor: 'rgba(59,130,246,0.05)' }}>
                          <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>{m.key}</td>
                          <td className="px-4 py-2.5 text-xs text-center font-mono font-bold"
                            style={{ color: aIsWorse && aScore > bScore ? '#EF4444' : '#3B82F6' }}>{m.a ?? '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-center font-mono font-bold"
                            style={{ color: aIsWorse && bScore > aScore ? '#EF4444' : '#F59E0B' }}>{m.b ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* Recommendation */}
          <Panel>
            <PanelHeader title="AI Recommendation" badge="Decision Support" badgeColor="green" />
            <div className="p-5">
              {resultA.congestion_score !== resultB.congestion_score ? (
                <div className="p-4 rounded-lg border" style={{
                  background: resultA.congestion_score < resultB.congestion_score ? 'rgba(59,130,246,0.08)' : 'rgba(245,158,11,0.08)',
                  borderColor: resultA.congestion_score < resultB.congestion_score ? 'rgba(59,130,246,0.3)' : 'rgba(245,158,11,0.3)',
                }}>
                  <div className="font-bold mb-2" style={{ color: resultA.congestion_score < resultB.congestion_score ? 'var(--blue)' : 'var(--amber)' }}>
                    Scenario {resultA.congestion_score < resultB.congestion_score ? 'A' : 'B'} has lower impact ({Math.min(resultA.congestion_score, resultB.congestion_score)}% vs {Math.max(resultA.congestion_score, resultB.congestion_score)}%)
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    For a {LABELS[formA.event_cause] || formA.event_cause} event, the {formA.time_of_day} time slot shows higher risk than {formB.time_of_day}.
                    Difference: <strong style={{ color: 'var(--text-primary)' }}>{Math.abs(resultA.congestion_score - resultB.congestion_score)} congestion points</strong>,{' '}
                    <strong>{Math.abs(resultA.expected_delay_min - resultB.expected_delay_min)} minutes</strong> delay gap.
                    Prioritize resources for the higher-risk scenario and deploy diversion routes proactively.
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Both scenarios have equal predicted impact. Evaluate based on operational constraints.</div>
              )}
            </div>
          </Panel>
        </>
      )}
    </div>
  )
}
