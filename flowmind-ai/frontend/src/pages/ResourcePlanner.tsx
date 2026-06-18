import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { recommendResources, runPrediction } from '../lib/api'
import { Panel, PanelHeader, FormSelect, Btn, Spinner } from '../components/UI'
import { Shield, Truck, AlertTriangle, Radio, Eye } from 'lucide-react'

const CAUSES = ['vehicle_breakdown','accident','public_event','procession','vip_movement','construction','water_logging','pot_holes','tree_fall','congestion','protest','others']

const ResourceCard = ({ icon: Icon, count, label, detail, color }: any) => (
  <div className="p-4 rounded-xl border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
    <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}22` }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{count}</div>
    <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    {detail && <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>{detail}</div>}
  </div>
)

export default function ResourcePlanner() {
  const [form, setForm] = useState({ event_cause: 'public_event', crowd_size: 25000, zone_risk: 'medium', road_closure: 'partial' })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const generate = async () => {
    setLoading(true)
    try {
      const pred = await runPrediction({ ...form, time_of_day: 'evening', is_planned: true })
      const res = await recommendResources({ ...form, risk_level: pred.risk_level })
      setResult({ ...res, risk_level: pred.risk_level, congestion_pct: pred.congestion_pct })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { generate() }, [])

  const deployZoneData = result?.deployment_zones?.map((z: any) => ({
    zone: z.zone, officers: z.officers, barricades: z.barricades,
  })) || []

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Resource Optimization Engine</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>AI-powered deployment recommendations based on 8,173 historical Bengaluru incidents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <Panel>
          <PanelHeader title="Deployment Parameters" />
          <div className="p-5 space-y-4">
            <FormSelect label="Event Cause" value={form.event_cause} onChange={e => set('event_cause', e.target.value)}>
              {CAUSES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </FormSelect>
            <FormSelect label="Zone Risk" value={form.zone_risk} onChange={e => set('zone_risk', e.target.value)}>
              <option value="high">High Risk (Central/North)</option>
              <option value="medium">Medium Risk (West/East)</option>
              <option value="low">Low Risk (South)</option>
            </FormSelect>
            <FormSelect label="Road Closure" value={form.road_closure} onChange={e => set('road_closure', e.target.value)}>
              <option value="no">No closure</option>
              <option value="partial">Partial closure</option>
              <option value="full">Full closure</option>
            </FormSelect>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Crowd Size: <span style={{ color: 'var(--blue)' }}>{form.crowd_size.toLocaleString()}</span>
              </label>
              <input type="range" min={500} max={150000} step={500} value={form.crowd_size}
                onChange={e => set('crowd_size', +e.target.value)}
                style={{ accentColor: 'var(--blue)', width: '100%' }} />
            </div>
            <Btn onClick={generate} disabled={loading} className="w-full justify-center">
              {loading ? 'Calculating…' : 'Generate Deployment Plan'}
            </Btn>
          </div>
        </Panel>

        {/* Resources */}
        <div className="lg:col-span-2 space-y-4">
          {loading
            ? <Spinner />
            : result && (
              <>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
                    Risk: {result.risk_level} · {result.congestion_pct} congestion
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total personnel: {result.total_personnel}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ResourceCard icon={Shield} count={result.officers} label="Traffic Officers" detail="On-ground deployment" color="#3B82F6" />
                  <ResourceCard icon={AlertTriangle} count={result.barricades} label="Barricades" detail="Traffic control points" color="#F59E0B" />
                  <ResourceCard icon={Truck} count={result.patrol_vehicles} label="Patrol Vehicles" detail="Mobile response units" color="#10B981" />
                  <ResourceCard icon={Radio} count={result.emergency_teams} label="Emergency Teams" detail="Medical + fire ready" color="#EF4444" />
                  <ResourceCard icon={Eye} count={result.drones} label="Surveillance Drones" detail="Aerial monitoring" color="#8B5CF6" />
                  <div className="p-4 rounded-xl border flex flex-col justify-center" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>AI Reasoning</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.reasoning}</div>
                  </div>
                </div>

                {/* Zone deployment chart */}
                <Panel>
                  <PanelHeader title="Deployment Zone Breakdown" badge="OR-Tools Optimized" badgeColor="blue" />
                  <div className="p-4" style={{ height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={deployZoneData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                        <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }} />
                        <Bar dataKey="officers" name="Officers" fill="var(--blue)" radius={[3,3,0,0]} />
                        <Bar dataKey="barricades" name="Barricades" fill="var(--amber)" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>

                {/* Emergency access plan */}
                <Panel>
                  <PanelHeader title="Emergency Access Plan" badge="Mandatory" badgeColor="red" />
                  <div className="p-4 space-y-2">
                    <div className="p-3 rounded-lg border text-xs" style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Ambulance Corridor:</span> Keep 3.5m lane clear on primary route at all times
                    </div>
                    <div className="p-3 rounded-lg border text-xs" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Fire Access:</span> Minimum 6m clearance at entry/exit points. Pre-notify fire station.
                    </div>
                    <div className="p-3 rounded-lg border text-xs" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--red)', fontWeight: 600 }}>Protocol:</span> Radio check every 15 minutes. Incident commander at gate 1.
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
