import React, { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

export default function Topbar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-14 flex items-center px-6 gap-4 sticky top-0 z-40 border-b"
      style={{ background: 'var(--bg-panel)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <Zap size={16} color="var(--blue)" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>ASTRA GRID</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'var(--blue)', color: '#fff' }}>v2.0</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}>FlowMind AI</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="inline-block w-2 h-2 rounded-full animate-pulse-glow" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>LIVE MONITORING</span>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>IST {time}</span>
      </div>
    </header>
  )
}
