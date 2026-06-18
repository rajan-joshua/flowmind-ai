import React from 'react'

// ── Panel ──────────────────────────────────────────────────────────────────────
interface PanelProps { children: React.ReactNode; className?: string }
export const Panel = ({ children, className = '' }: PanelProps) => (
  <div className={`rounded-xl border overflow-hidden ${className}`}
    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
    {children}
  </div>
)

interface PanelHeaderProps { title: string; badge?: string; badgeColor?: string; children?: React.ReactNode }
export const PanelHeader = ({ title, badge, badgeColor = 'blue', children }: PanelHeaderProps) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/15 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    live: 'bg-green-500/15 text-green-400 border-green-500/30',
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colors[badgeColor] || colors.blue}`}>
            {badge}
          </span>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Metric Card ────────────────────────────────────────────────────────────────
interface MetricCardProps { label: string; value: string | number; sub?: string; change?: string; changeDir?: 'up' | 'down' | 'neutral'; accent?: string }
export const MetricCard = ({ label, value, sub, change, changeDir = 'neutral', accent = '#3B82F6' }: MetricCardProps) => {
  const changeColor = changeDir === 'up' ? '#10B981' : changeDir === 'down' ? '#EF4444' : '#F59E0B'
  return (
    <div className="rounded-xl border p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accent }} />
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-3xl font-bold font-mono my-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</div>}
      {change && <div className="text-[11px] font-mono mt-1" style={{ color: changeColor }}>{change}</div>}
    </div>
  )
}

// ── Risk Badge ─────────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, { bg: string; text: string }> = {
  Critical: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  High: { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
  Moderate: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  Low: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
}
export const RiskBadge = ({ level }: { level: string }) => {
  const c = RISK_COLORS[level] || RISK_COLORS.Low
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: c.bg, color: c.text }}>
      {level?.toUpperCase()}
    </span>
  )
}

// ── Priority Dot ───────────────────────────────────────────────────────────────
export const PriorityDot = ({ priority }: { priority: string }) => {
  const color = priority === 'High' ? '#EF4444' : '#10B981'
  return <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: priority === 'High' ? `0 0 6px ${color}` : 'none' }} />
}

// ── Spinner ────────────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--blue)' }} />
  </div>
)

// ── Alert Strip ────────────────────────────────────────────────────────────────
const ALERT_STYLES: Record<string, { bg: string; border: string; dot: string }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', dot: '#EF4444' },
  WARNING: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', dot: '#F59E0B' },
  INFO: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', dot: '#3B82F6' },
}
export const AlertStrip = ({ level, message }: { level: string; message: string }) => {
  const s = ALERT_STYLES[level] || ALERT_STYLES.INFO
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-lg border mb-2"
      style={{ background: s.bg, borderColor: s.border }}>
      <span className="inline-block w-2 h-2 rounded-full mt-1 flex-shrink-0 animate-pulse-glow" style={{ background: s.dot }} />
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="font-bold" style={{ color: s.dot }}>{level}</span> — {message}
      </span>
    </div>
  )
}

// ── SHAP Bar ───────────────────────────────────────────────────────────────────
export const ShapBar = ({ label, value, max = 35 }: { label: string; value: number; max?: number }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="text-xs w-28 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: 'var(--blue)' }} />
    </div>
    <span className="text-[11px] font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>{value}%</span>
  </div>
)

// ── Progress Row ───────────────────────────────────────────────────────────────
export const ProgressRow = ({ label, value, max, color = '#3B82F6' }: { label: string; value: number; max: number; color?: string }) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
    <span className="text-[11px] font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>{value}</span>
  </div>
)

// ── Button ─────────────────────────────────────────────────────────────────────
interface BtnProps { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean; className?: string }
export const Btn = ({ children, onClick, variant = 'primary', disabled, className = '' }: BtnProps) => {
  const styles = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    outline: 'border border-blue-500 text-blue-400 hover:bg-blue-500/10',
    ghost: 'text-blue-400 hover:bg-blue-500/10',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ── Form Input / Select ────────────────────────────────────────────────────────
export const FormInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <input {...props} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      onFocus={e => e.target.style.borderColor = 'var(--blue)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
  </div>
)

export const FormSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</label>
    <select {...props} className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
      {children}
    </select>
  </div>
)
