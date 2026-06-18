import React, { useEffect, useRef, useState } from 'react'
import { fetchHeatmap, fetchRecentEvents } from '../lib/api'
import { Panel, PanelHeader, RiskBadge, Spinner } from '../components/UI'

import L from 'leaflet'
import 'leaflet.heat'

const CAUSE_COLORS: Record<string, string> = {
  vehicle_breakdown: '#3B82F6',
  accident: '#EF4444',
  public_event: '#8B5CF6',
  construction: '#F97316',
  water_logging: '#06B6D4',
  pot_holes: '#F59E0B',
  tree_fall: '#10B981',
  congestion: '#EC4899',
  others: '#94A3B8',
  procession: '#A78BFA',
  vip_movement: '#FB7185',
  protest: '#FCD34D',
}

export default function CityMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const [heatPoints, setHeatPoints] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'heatmap' | 'markers'>('heatmap')

  const markersRef = useRef<any[]>([])
  const heatLayerRef = useRef<any>(null)

  useEffect(() => {
    Promise.all([fetchHeatmap(600), fetchRecentEvents(50)])
      .then(([h, e]) => {
        setHeatPoints(h)
        setEvents(e)
        setLoading(false)
      })
      .catch(err => {
        console.error('Map data load failed:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    })

   L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }
).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [loading])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    const filtered =
      filter === 'all'
        ? heatPoints
        : heatPoints.filter(p => p.cause === filter)

    if (view === 'heatmap') {
      const points = filtered.map(p => [
        p.lat,
        p.lng,
        p.weight || 0.5,
      ])

      if (points.length > 0) {
        heatLayerRef.current = (L as any)
          .heatLayer(points, {
            radius: 22,
            blur: 15,
            maxZoom: 17,
            gradient: {
              0.2: '#3B82F6',
              0.5: '#F59E0B',
              0.8: '#F97316',
              1.0: '#EF4444',
            },
          })
          .addTo(map)
      }
    } else {
      const toShow =
        filter === 'all'
          ? events
          : events.filter(e => e.event_cause === filter)

      toShow.slice(0, 200).forEach(e => {
        const color = CAUSE_COLORS[e.event_cause] || '#94A3B8'

        const icon = L.divIcon({
          html: `
            <div
              style="
                width:10px;
                height:10px;
                border-radius:50%;
                background:${color};
                border:2px solid rgba(255,255,255,0.3);
                box-shadow:0 0 6px ${color};
              "
            ></div>
          `,
          className: '',
          iconSize: [10, 10],
        })

        const marker = L.marker(
          [e.latitude, e.longitude],
          { icon }
        )
          .bindPopup(`
            <div style="font-size:12px">
              <b>${e.event_cause?.replace(/_/g, ' ')}</b><br/>
              ${e.police_station || ''}<br/>
              <span style="color:${color}">
                ${e.priority} priority · ${e.status}
              </span>
            </div>
          `)
          .addTo(map)

        markersRef.current.push(marker)
      })
    }
  }, [heatPoints, events, view, filter])

  const causes = [
    'all',
    ...Array.from(new Set(heatPoints.map(p => p.cause))).sort(),
  ]

  return (
    <div className="p-6 space-y-4 animate-slide-in">
      <div>
        <h1
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Digital Twin City Map
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Interactive zone risk visualization with real event data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="space-y-3">
          <Panel>
            <PanelHeader title="Map Controls" />
            <div className="p-4 space-y-3">
              <div>
                <label
                  className="text-[10px] font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  View Mode
                </label>

                <div className="flex gap-2">
                  {(['heatmap', 'markers'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className="flex-1 py-1.5 rounded text-xs font-medium cursor-pointer transition-all"
                      style={{
                        background:
                          view === v
                            ? 'var(--blue)'
                            : 'var(--bg-elevated)',
                        color:
                          view === v
                            ? '#fff'
                            : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  className="text-[10px] font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Filter by Cause
                </label>

                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded text-xs outline-none"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {causes.map(c => (
                    <option key={c} value={c}>
                      {c === 'all'
                        ? 'All Causes'
                        : c.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Risk Legend" />
            <div className="p-4 space-y-2">
              {[
                { color: '#EF4444', label: 'Critical (Score ≥50)' },
                { color: '#F97316', label: 'High (Score 40–49)' },
                { color: '#F59E0B', label: 'Moderate (Score 30–39)' },
                { color: '#10B981', label: 'Low (Score <30)' },
              ].map(item => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Active Incidents"
              badge="LIVE"
              badgeColor="live"
            />
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {events.slice(0, 10).map((e, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg text-xs border"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div
                    className="font-semibold capitalize mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {e.event_cause?.replace(/_/g, ' ')}
                  </div>

                  <div
                    className="truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {e.police_station || e.zone}
                  </div>

                  <RiskBadge
                    level={e.priority === 'High' ? 'High' : 'Low'}
                  />
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <Spinner />
          ) : (
            <div
              ref={mapRef}
              className="w-full rounded-xl overflow-hidden border"
              style={{
                height: '600px',
                borderColor: 'var(--border)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}