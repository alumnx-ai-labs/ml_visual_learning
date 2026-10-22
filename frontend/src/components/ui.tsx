import katex from 'katex'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, { displayMode: block, throwOnError: false })
  return block ? (
    <div className="formula" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="kpi">
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      {hint && <div className="d">{hint}</div>}
    </div>
  )
}

export function Legend({ items }: { items: { color: string; label: string; ring?: boolean }[] }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label}>
          <i style={it.ring ? { border: `2px solid ${it.color}`, background: 'transparent' } : { background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

export function Callout({ children, kind }: { children: ReactNode; kind?: 'warn' | 'good' }) {
  return <div className={'callout caption ' + (kind ?? '')}>{children}</div>
}

export function Card({ title, children, flat }: { title?: ReactNode; children: ReactNode; flat?: boolean }) {
  return (
    <section className={'card' + (flat ? ' flat' : '')}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  )
}

export const fmt = (v: number | null | undefined, d = 3) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : String(+v.toFixed(d)))

/** Step player: play/pause/prev/next + scrubber. Returns the current frame index. */
export function usePlayer(total: number, fps = 8) {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const last = Math.max(0, total - 1)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setI((v) => Math.min(v + 1, last)), 1000 / (fps * speed))
    return () => clearInterval(id)
  }, [playing, speed, fps, last])

  useEffect(() => {
    if (playing && i >= last) setPlaying(false)
  }, [playing, i, last])

  useEffect(() => {
    setI((v) => Math.min(v, last))
  }, [last])

  return { i, setI, playing, speed, setSpeed, last, toggle: () => { if (i >= last) setI(0); setPlaying((p) => !p) }, setPlaying }
}

export function PlayerBar({ p, label }: { p: ReturnType<typeof usePlayer>; label?: (i: number) => string }) {
  return (
    <div className="player">
      <button className="btn" onClick={() => { p.setPlaying(false); p.setI(0) }} title="Back to start">Restart</button>
      <button className="btn" onClick={() => { p.setPlaying(false); p.setI(Math.max(0, p.i - 1)) }} title="Step back">Back</button>
      <button className="btn primary" onClick={p.toggle} style={{ minWidth: 76 }}>{p.playing ? 'Pause' : 'Play'}</button>
      <button className="btn" onClick={() => { p.setPlaying(false); p.setI(Math.min(p.last, p.i + 1)) }} title="Step forward">Next</button>
      <input type="range" min={0} max={p.last} value={p.i} onChange={(e) => { p.setPlaying(false); p.setI(+e.target.value) }} />
      <span className="small muted" style={{ minWidth: 92, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{label ? label(p.i) : `${p.i} / ${p.last}`}</span>
      <select className="select" value={p.speed} onChange={(e) => p.setSpeed(+e.target.value)} title="Speed">
        <option value={0.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={2}>2×</option>
        <option value={4}>4×</option>
      </select>
    </div>
  )
}

export function Slider({ label, value, min, max, step, onChange, help, display }: {
  label: string; value: number; min: number; max: number; step: number; help?: string; display?: string; onChange: (v: number) => void
}) {
  return (
    <div className="ctl">
      <label>{label}<b>{display ?? value}</b></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      {help && <div className="help">{help}</div>}
    </div>
  )
}

/** Keeps a value that only updates after `ms` of quiet — avoids re-running the model on every slider pixel. */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    clearTimeout(t.current)
    t.current = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t.current)
  }, [value, ms])
  return v
}
