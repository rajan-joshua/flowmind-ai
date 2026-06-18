import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts'
import { fetchCauses, fetchMonthly, fetchHourly, fetchZoneRisk, fetchCorridors, fetchPoliceStations, fetchClosureByCause, fetchSummary } from '../lib/api'
import { Panel, PanelHeader, Spinner } from '../components/UI'

const COLORS = ['#3B82F6','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1','#84CC16','#F43F5E']

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      <div className="mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--blue)' }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong></div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [causes, setCauses] = useState<any[]>([])
  const [monthly, setMonthly] = useState<any[]>([])
  const [hourly, setHourly] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [corridors, setCorridors] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [closure, setClosure] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchCauses(), fetchMonthly(), fetchHourly(), fetchZoneRisk(),
      fetchCorridors(), fetchPoliceStations(), fetchClosureByCause(), fetchSummary()
    ]).then(([ca, mo, ho, zo, co, ps, cl, su]) => {
      setCauses(ca); setMonthly(mo); setHourly(ho); setZones(zo)
      setCorridors(co); setStations(ps); setClosure(cl); setSummary(su)
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />

  const radarData = zones.slice(0, 6).map(z => ({
    zone: z.name?.replace('Zone', 'Z')?.substring(0, 12),
    risk: z.risk_score,
    closures: Math.round(z.closures / z.total * 100),
    highPrio: Math.round(z.high_prio / z.total * 100),
  }))

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Analytics Dashboard</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Deep-dive into {summary?.total_events?.toLocaleString()} Bengaluru traffic events</p>
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Planned Events', value: summary?.planned_events?.toLocaleString(), pct: `${(summary?.planned_events/summary?.total_events*100).toFixed(1)}%`, color: '#10B981' },
          { label: 'Unplanned Events', value: summary?.unplanned_events?.toLocaleString(), pct: `${(summary?.unplanned_events/summary?.total_events*100).toFixed(1)}%`, color: '#EF4444' },
          { label: 'Avg Duration', value: `${summary?.avg_duration_min?.toFixed(0)} min`, pct: 'per incident', color: '#F59E0B' },
          { label: 'Closure Rate', value: `${summary?.closure_rate_pct}%`, pct: 'require road closure', color: '#F97316' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="h-0.5 rounded-full mb-3" style={{ background: item.color }} />
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
            <div className="text-xs mt-1" style={{ color: item.color }}>{item.pct}</div>
          </div>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Top Event Causes — Volume" badge={`${causes.length} categories`} />
          <div className="p-4" style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={causes} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="cause" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickFormatter={v => v?.replace(/_/g,' ')} width={110} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" name="Events" radius={[0,3,3,0]}>
                  {causes.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Monthly Event Trend" badge="Nov 2023 – Apr 2024" />
          <div className="p-4" style={{ height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={monthly} margin={{ top: 5, right: 10, bottom: 25, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip content={<TT />} />
                <Line type="monotone" dataKey="count" name="Events" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--blue)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="24-Hour Incident Pattern" badge="Bengaluru Insight" badgeColor="amber" />
          <div className="p-4">
            <div className="text-[11px] px-3 py-2 rounded mb-3" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠️ Finding: Peak incidents 8–10pm — deploy extra resources for evening shift
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={hourly} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<TT />} />
                  <Bar dataKey="count" name="Incidents" radius={[2,2,0,0]}>
                    {hourly.map((d,i) => <Cell key={i} fill={d.count > 500 ? '#EF4444' : d.count > 350 ? '#F97316' : '#3B82F6'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Zone Risk Radar" badge="Multi-Dimension" badgeColor="blue" />
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(59,130,246,0.15)" />
                <PolarAngleAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Radar name="Risk Score" dataKey="risk" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                <Radar name="Closure %" dataKey="closures" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.10} />
                <Radar name="High Prio %" dataKey="highPrio" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.10} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip content={<TT />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Top Traffic Corridors" badge="Road Impact" />
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={corridors.slice(0,10)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={120} />
                <Tooltip content={<TT />} />
                <Bar dataKey="total" name="Events" fill="var(--cyan)" radius={[0,3,3,0]} />
                <Bar dataKey="closures" name="Closures" fill="var(--orange)" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Road Closure Rate by Cause" badge="Ranked" badgeColor="red" />
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={closure.slice(0,10)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${v}%`} domain={[0,100]} />
                <YAxis type="category" dataKey="cause" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  tickFormatter={v => v?.replace(/_/g,' ')} width={110} />
                <Tooltip content={<TT />} />
                <Bar dataKey="closure_rate" name="Closure Rate %" radius={[0,3,3,0]}>
                  {closure.slice(0,10).map((_,i) => <Cell key={i} fill={i < 3 ? '#EF4444' : i < 6 ? '#F97316' : '#F59E0B'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Top Police Stations Table */}
      <Panel>
        <PanelHeader title="Police Station Load — All Jurisdictions" badge={`${stations.length} stations`} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['#','Station','Total Events','High Priority','Active Now','Load Level'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stations.map((s, i) => {
                const pct = Math.round(s.total / (stations[0]?.total || 1) * 100)
                return (
                  <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(59,130,246,0.05)' }}>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{i+1}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{s.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: '#F97316' }}>{s.high_prio.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: s.active > 0 ? '#10B981' : 'var(--text-muted)' }}>{s.active}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i < 3 ? '#EF4444' : i < 7 ? '#F97316' : '#3B82F6' }} />
                        </div>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
