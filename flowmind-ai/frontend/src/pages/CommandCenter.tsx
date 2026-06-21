import React, { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  fetchSummary, fetchCauses, fetchMonthly, fetchHourly,
  fetchZoneRisk, fetchPoliceStations, fetchClosureByCause,
  fetchAlerts, fetchRecentEvents
} from '../lib/api'
import { Panel, PanelHeader, MetricCard, AlertStrip, PriorityDot, RiskBadge, Spinner, ProgressRow } from '../components/UI'

const COLORS = ['#3B82F6','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1','#84CC16','#F43F5E']

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
      <div style={{ color: 'var(--text-muted)' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--blue)' }}>{p.name}: <strong>{p.value?.toLocaleString()}</strong></div>
      ))}
    </div>
  )
}

export default function CommandCenter() {
  const [summary, setSummary] = useState<any>(null)
  const [causes, setCauses] = useState<any[]>([])
  const [monthly, setMonthly] = useState<any[]>([])
  const [hourly, setHourly] = useState<any[]>([])
  const [zones, setZones] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [closure, setClosure] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, c, m, h, z, ps, cl, al, ev] = await Promise.all([
        fetchSummary(), fetchCauses(), fetchMonthly(), fetchHourly(),
        fetchZoneRisk(), fetchPoliceStations(), fetchClosureByCause(),
        fetchAlerts(), fetchRecentEvents(12),
      ])
      setSummary(s); setCauses(c); setMonthly(m); setHourly(h)
      setZones(z); setStations(ps); setClosure(cl); setAlerts(al); setEvents(ev)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Live pulse every 30s
  useEffect(() => {
    const id = setInterval(() => fetchRecentEvents(12).then(setEvents).catch(() => {}), 30000)
    return () => clearInterval(id)
  }, [])

  if (loading) return <Spinner />

  const maxStation = Math.max(...stations.map(s => s.total), 1)

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Command Center</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Real-time Bengaluru traffic intelligence · {summary?.total_events?.toLocaleString()} events tracked
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Events" value={summary?.total_events?.toLocaleString() ?? '—'} sub="Sep 2023 – Apr 2024" accent="#EF4444" change="▲ Dataset loaded" changeDir="neutral" />
        <MetricCard label="Active Events" value={summary?.active_events?.toLocaleString() ?? '—'} sub="Currently open incidents" accent="#F59E0B" change="↑ Requires attention" changeDir="down" />
        <MetricCard label="High Priority" value={summary?.high_priority?.toLocaleString() ?? '—'} sub="Require immediate action" accent="#F97316" change={`${(summary?.high_priority / summary?.total_events * 100).toFixed(1)}% of all events`} changeDir="down" />
        <MetricCard label="Road Closures" value={summary?.road_closures?.toLocaleString() ?? '—'} sub="Lanes/roads affected" accent="#3B82F6" change={`${summary?.closure_rate_pct}% closure rate`} changeDir="neutral" />
      </div>

      {/* Alerts */}
      <Panel>
        <PanelHeader title="🔴 Live Alerts" badge="LIVE" badgeColor="live" />
        <div className="p-4">
          {alerts.map((a, i) => <AlertStrip key={i} level={a.level} message={a.message} />)}
        </div>
      </Panel>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="Event Cause Distribution" badge={`${summary?.total_events?.toLocaleString()} events`} />
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={causes} dataKey="count" nameKey="cause" cx="50%" cy="50%" outerRadius={90} label={({ cause, percent }) => `${cause?.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {causes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Monthly Event Volume" badge="Nov 2023 – Apr 2024" />
          <div className="p-4" style={{ height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<TT />} />
                <Bar dataKey="count" name="Events" fill="var(--blue)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zone Risk */}
        <Panel>
          <PanelHeader title="Zone Risk Scores" badge="AI Computed" badgeColor="amber" />
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Zone','Events','High Prio','Risk',''].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.slice(0, 8).map((z, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: 'rgba(59,130,246,0.05)' }}>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{z.name}</td>
                    <td className="px-4 py-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{z.total}</td>
                    <td className="px-4 py-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{z.high_prio}</td>
                    <td className="px-4 py-2 text-xs font-mono" style={{ color: z.risk_score >= 50 ? 'var(--red)' : z.risk_score >= 40 ? 'var(--orange)' : 'var(--amber)' }}>{z.risk_score}</td>
                    <td className="px-4 py-2">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(z.risk_score, 100)}%`, background: z.risk_score >= 50 ? '#EF4444' : '#F59E0B' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Active Incidents */}
        <Panel>
          <PanelHeader title="Active Incidents" badge="LIVE" badgeColor="live" />
          <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:border-blue-500/30"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <PriorityDot priority={e.priority} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{e.event_cause?.replace(/_/g,' ')}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{e.police_station || e.zone || 'Bengaluru'}</div>
                </div>
                <RiskBadge level={e.priority === 'High' ? 'High' : 'Low'} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Hourly + Stations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <PanelHeader title="📈 Hourly Incident Pattern" badge="Key Insight" badgeColor="amber" />
          <div className="p-4">
            <div className="text-[11px] mb-3 px-3 py-2 rounded" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠️ Peak incidents: 8pm–10pm — NOT during rush hour (counter-intuitive finding from dataset)
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={hourly} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={h => `${h}h`} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip content={<TT />} />
                  <Line type="monotone" dataKey="count" name="Incidents" stroke="var(--cyan)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="🚔 Top Police Station Zones" badge="Resource Intel" />
          <div className="p-4 space-y-1">
            {stations.slice(0, 10).map((s, i) => (
              <ProgressRow key={i} label={s.name} value={s.total} max={maxStation} color={i < 3 ? '#EF4444' : '#3B82F6'} />
            ))}
          </div>
        </Panel>
      </div>

      {/* Road Closure Rate */}
      <Panel>
        <PanelHeader title="Road Closure Rate by Event Cause" badge="Insight" />
        <div className="p-4" style={{ height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={closure.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="cause" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickFormatter={v => v?.replace(/_/g,' ')} width={100} />
              <Tooltip content={<TT />} />
              <Bar dataKey="closure_rate" name="Closure Rate %" fill="var(--orange)" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  )
}
