import { useEffect, useState, type ReactNode } from 'react'
import { runModel } from '../api'
import { findTerm, type Term } from '../content/terms'
import { Rich, TermTip } from '../components/Rich'
import type { RunResponse } from '../types'

export interface SlideDef {
  title: string
  text: string[]
  /** draws the slide's picture; t = animation frame (0 when not animated) */
  visual: (t: number) => ReactNode
  frames?: number
  fps?: number
}

export interface RunRequest { algo: string; dataset: string; n?: number; seed?: number; params?: Record<string, number | string> }

/** Fetches the fixed runs a lesson deck needs (default settings, no knobs). */
export function useRuns(reqs: RunRequest[]) {
  const key = JSON.stringify(reqs)
  const [runs, setRuns] = useState<RunResponse[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setRuns(null)
    Promise.all(reqs.map((r) => runModel({ n: 150, seed: 7, params: {}, noise: null, ...r })))
      .then((rs) => { if (live) setRuns(rs) })
      .catch((e) => { if (live) setErr(String(e.message ?? e)) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return { runs, err }
}

function slideTerms(text: string[]): Term[] {
  const found = new Map<string, Term>()
  for (const t of text) for (const m of t.matchAll(/\*\*([^*]+)\*\*/g)) {
    const term = findTerm(m[1])
    if (term && !found.has(term.name)) found.set(term.name, term)
  }
  return [...found.values()]
}

export function Deck({ name, slides }: { name: string; slides: SlideDef[] }) {
  const [i, setI] = useState(0)
  const s = slides[Math.min(i, slides.length - 1)]
  const frames = s.frames ?? 1
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => { setT(0); setPlaying(frames > 1) }, [i, frames])
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setT((v) => Math.min(v + 1, frames - 1)), 1000 / (s.fps ?? 12))
    return () => clearInterval(id)
  }, [playing, frames, s.fps])
  useEffect(() => { if (playing && t >= frames - 1) setPlaying(false) }, [playing, t, frames])

  const go = (n: number) => setI(Math.max(0, Math.min(slides.length - 1, n)))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return
      if (e.key === 'ArrowRight') setI((v) => Math.min(slides.length - 1, v + 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  const terms = slideTerms(s.text)

  return (
    <div className="deck">
      <div className="deck-top">
        <span className="deck-name">{name}</span>
        <div className="deck-dots">
          {slides.map((sl, k) => (
            <button key={k} className={'deck-dot' + (k === i ? ' on' : k < i ? ' done' : '')} onClick={() => go(k)} title={sl.title} aria-label={`Slide ${k + 1}: ${sl.title}`} />
          ))}
        </div>
        <span className="small muted">{i + 1} / {slides.length}</span>
      </div>

      <div className="slide" key={i}>
        <div className="slide-visual">
          {s.visual(t)}
          {frames > 1 && (
            <div className="slide-anim">
              <div className="slide-anim-bar"><div style={{ width: `${(t / (frames - 1)) * 100}%` }} /></div>
              <button className="btn" onClick={() => { if (t >= frames - 1) setT(0); setPlaying((p) => !p) }}>
                {playing ? 'Pause' : t >= frames - 1 ? 'Replay' : 'Play'}
              </button>
            </div>
          )}
        </div>
        <div className="slide-text">
          <div className="slide-step">Step {i + 1}</div>
          <h2>{s.title}</h2>
          {s.text.map((p, k) => <p key={k}><Rich text={p} /></p>)}
          {terms.length > 0 && (
            <div className="slide-terms">
              <div className="slide-terms-label">Words on this slide</div>
              {terms.map((term) => (
                <div key={term.name} className="slide-term">
                  <TermTip term={term}><b>{term.name}</b></TermTip>
                  <span> — {term.plain}</span>
                  <div className="slide-term-ex">e.g. {term.example}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="deck-nav">
        <button className="btn" disabled={i === 0} onClick={() => go(i - 1)}>← Back</button>
        <span className="small muted">Tip: use the ← → arrow keys</span>
        <button className="btn primary" disabled={i === slides.length - 1} onClick={() => go(i + 1)}>
          {i === slides.length - 1 ? 'The end' : 'Next →'}
        </button>
      </div>
    </div>
  )
}

/** Big on-chart label (top-left of the plot area). */
export function ChartLabel({ x = 12, y = 22, children }: { x?: number; y?: number; children: ReactNode }) {
  return <text x={x} y={y} className="chart-label">{children}</text>
}

/** Recap: the algorithm as a row of boxes. */
export function Recap({ steps, loop }: { steps: string[]; loop?: [number, number] }) {
  return (
    <div className="recap">
      {steps.map((s, k) => (
        <div key={k} className={'recap-step' + (loop && k >= loop[0] && k <= loop[1] ? ' in-loop' : '')}>
          <span className="recap-n">{k + 1}</span>
          <span><Rich text={s} /></span>
        </div>
      ))}
      {loop && <div className="recap-loop">Steps {loop[0] + 1}–{loop[1] + 1} repeat until the model stops improving</div>}
    </div>
  )
}

export const trainOf = (run: RunResponse) => run.data.is_test.flatMap((t, i) => (t ? [] : [i]))
export const testOf = (run: RunResponse) => run.data.is_test.flatMap((t, i) => (t ? [i] : []))
export const pct = (v: number) => `${Math.round(v * 100)}%`
