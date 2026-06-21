import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Map, Zap, Users, BarChart3, MessageSquare,
  HelpCircle, GitCompare, ChevronRight, ChevronLeft
} from 'lucide-react'

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Command Center' },
  { path: '/map', icon: Map, label: 'City Map' },
  { path: '/simulation', icon: Zap, label: 'Simulation Studio' },
  { path: '/resources', icon: Users, label: 'Resource Planner' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { path: '/xai', icon: HelpCircle, label: 'Explainable AI' },
  { path: '/compare', icon: GitCompare, label: 'Scenario Compare' },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-50 flex flex-col items-center py-4 border-r transition-all duration-300"
      style={{
        width: expanded ? '220px' : '64px',
        background: 'var(--bg-panel)',
        borderColor: 'var(--border)',
      }}>
      {/* Logo */}
      <div
        onClick={() => setExpanded(e => !e)}
        className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-white font-bold text-xs flex-shrink-0 mb-3"
        style={{ background: 'var(--blue)' }}>
        {expanded ? <ChevronLeft size={16} /> : 'AG'}
      </div>

      {expanded && (
        <div className="text-xs font-bold tracking-widest mb-3 px-2" style={{ color: 'var(--blue)' }}>
          FLOWMIND AI
        </div>
      )}

      <div className="w-8 h-px mb-3" style={{ background: 'var(--border)' }} />

      {/* Nav items */}
      <nav className="flex flex-col gap-1 w-full px-2 flex-1">
        {NAV.map(item => {
          const active = loc.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              title={!expanded ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-lg transition-all duration-200 cursor-pointer border-none ${
                expanded ? 'w-full px-3 py-2' : 'w-10 h-10 justify-center mx-auto'
              }`}
              style={{
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active ? 'var(--blue)' : 'var(--text-muted)',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--blue)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
              <item.icon size={18} className="flex-shrink-0" />
              {expanded && <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Expand toggle at bottom */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-auto w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ color: 'var(--text-muted)' }}>
          <ChevronRight size={16} />
        </button>
      )}
    </aside>
  )
}
