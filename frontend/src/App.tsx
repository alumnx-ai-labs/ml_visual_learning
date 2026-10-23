import { useEffect, useMemo, useState } from 'react'
import { getMeta, runModel } from './api'
import { DataTab } from './components/DataTab'
import { Learn } from './components/Learn'
import { ResultsTab } from './components/ResultsTab'
import { Callout, Card, Slider, useDebounced } from './components/ui'
import type { AlgoSpec, Meta, RunResponse } from './types'
import { ForestViz } from './viz/ForestViz'
import { LinearViz } from './viz/LinearViz'
import { LogisticViz } from './viz/LogisticViz'
import { XgbViz } from './viz/XgbViz'
import { DbscanDeck } from './slides/DbscanDeck'
import { ForestDeck } from './slides/ForestDeck'
import { HierarchicalDeck } from './slides/HierarchicalDeck'
import { KMeansDeck } from './slides/KMeansDeck'
import { LinearDeck } from './slides/LinearDeck'
import { LogisticDeck } from './slides/LogisticDeck'
import { PcaDeck } from './slides/PcaDeck'
import { XgbDeck } from './slides/XgbDeck'

const DECKS: Record<string, () => React.ReactElement> = {
  linear: LinearDeck,
  logistic: LogisticDeck,
  forest: ForestDeck,
  xgboost: XgbDeck,
  kmeans: KMeansDeck,
  dbscan: DbscanDeck,
  pca: PcaDeck,
  hierarchical: HierarchicalDeck,
}

const VIZ: Record<string, (p: { run: RunResponse }) => React.ReactElement> = {
  linear: LinearViz,
  logistic: LogisticViz,
  forest: ForestViz,
  xgboost: XgbViz,
}

const TABS = [
  { id: 'learn', label: 'Learn' },
  { id: 'data', label: 'Data' },
  { id: 'watch', label: 'Watch it learn' },
  { id: 'results', label: 'Results' },
] as const
type TabId = (typeof TABS)[number]['id']

const defaults = (a: AlgoSpec) => Object.fromEntries(a.params.map((p) => [p.key, p.default]))

export default function App() {
  const [meta, setMeta] = useState<Meta | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [algoId, setAlgoId] = useState('linear')
  const [dataset, setDataset] = useState('')
  const [n, setN] = useState(150)
  const [noise, setNoise] = useState<number | null>(null)
  const [seed, setSeed] = useState(42)
  const [params, setParams] = useState<Record<string, number | string>>({})
  const [tab, setTab] = useState<TabId>('learn')
  const [mode, setMode] = useState<'lesson' | 'playground'>('lesson')
  const [run, setRun] = useState<RunResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getMeta().then(setMeta).catch((e) => setErr(String(e.message ?? e)))
  }, [])

  const algo = meta?.algorithms.find((a) => a.id === algoId)
  const compatible = useMemo(
    () => (meta && algo ? meta.datasets.filter((d) => d.tasks.some((t) => algo.tasks.includes(t)) && (!algo.needs_2d || d.dims === 2)) : []),
    [meta, algo],
  )
  const ds = compatible.find((d) => d.key === dataset)

  // switching algorithm: reset its knobs and pick a dataset it understands
  useEffect(() => {
    if (!algo) return
    setParams(defaults(algo))
    setDataset((cur) => (compatible.some((d) => d.key === cur) ? cur : compatible[0]?.key ?? ''))
  }, [algo, compatible])

  useEffect(() => {
    setNoise(ds?.noise?.default ?? null)
  }, [ds])

  const request = useDebounced(
    useMemo(() => ({ algo: algoId, dataset, n, noise, seed, params }), [algoId, dataset, n, noise, seed, params]),
    250,
  )

  useEffect(() => {
    if (mode !== 'playground' || !request.dataset || !Object.keys(request.params).length) return
    const ctl = new AbortController()
    setLoading(true)
    runModel(request, ctl.signal)
      .then((r) => { setRun(r); setErr(null) })
      .catch((e) => { if (e.name !== 'AbortError') setErr(String(e.message ?? e)) })
      .finally(() => setLoading(false))
    return () => ctl.abort()
  }, [request, mode])

  const Viz = VIZ[algoId]
  const fresh = run && run.params && algo && run.data.dataset === ds?.name && VIZ[algoId] && Object.keys(params).every((k) => k in run.params)

  return (
    <>
      <header className="app-header">
        <div className="brand"><div className="logo">ML</div>Visual Learning Lab</div>
        <select className="select" style={{ fontWeight: 600, minWidth: 240 }} value={algoId} onChange={(e) => {
          const next = meta?.algorithms.find((a) => a.id === e.target.value)
          setAlgoId(e.target.value)
          setRun(null)
          if (next?.category === 'unsupervised') setMode('lesson') // the playground only supports supervised models
        }} aria-label="Choose algorithm">
          <optgroup label="Supervised learning">
            {meta?.algorithms.filter((a) => a.category === 'supervised').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </optgroup>
          <optgroup label="Unsupervised learning">
            {meta?.algorithms.filter((a) => a.category === 'unsupervised').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </optgroup>
        </select>
        <div className="mode-switch" role="tablist">
          <button className={mode === 'lesson' ? 'on' : ''} onClick={() => setMode('lesson')}>Guided lesson</button>
          <button className={mode === 'playground' ? 'on' : ''} disabled={algo?.category === 'unsupervised'}
            title={algo?.category === 'unsupervised' ? 'The playground is available for the supervised models' : undefined}
            onClick={() => setMode('playground')}>Playground (advanced)</button>
        </div>
        {mode === 'playground' && <span className="status"><span className={'dot' + (loading ? ' busy' : '')} />{loading ? 'Training model…' : run ? 'Model trained' : 'Waiting'}</span>}
      </header>

      {mode === 'lesson' && (
        <div className="lesson-shell">
          {err && <Callout kind="warn">{err}</Callout>}
          {!meta && !err && <p className="muted">Connecting to the backend…</p>}
          {meta && DECKS[algoId] && (() => { const D = DECKS[algoId]; return <D key={algoId} /> })()}
        </div>
      )}

      {mode === 'playground' && <div className="shell">
        <aside className="side">
          <Card>
            <div className="side-title">Step 1 · Data</div>
            <div className="ctl">
              <label>Dataset</label>
              <select className="select" style={{ width: '100%' }} value={dataset} onChange={(e) => setDataset(e.target.value)}>
                {compatible.map((d) => <option key={d.key} value={d.key}>{d.name}{d.tasks.includes('classification') && algo?.tasks.length === 2 ? ' (classify)' : d.tasks.includes('regression') && algo?.tasks.length === 2 ? ' (predict a number)' : ''}</option>)}
              </select>
            </div>
            {ds && !ds.fixed_n && <Slider label="Number of points" value={n} min={40} max={400} step={10} onChange={setN} />}
            {ds?.noise && noise !== null && (
              <Slider label={ds.noise.label} value={noise} min={ds.noise.min} max={ds.noise.max} step={ds.noise.step} onChange={setNoise}
                help="More noise = messier data = harder to learn." />
            )}
            {ds && !ds.fixed_n && <button className="btn block" onClick={() => setSeed((s) => s + 1)}>Draw a new random sample</button>}
          </Card>

          {algo && (
            <Card>
              <div className="side-title">Step 2 · Model settings</div>
              {algo.params.map((p) =>
                p.type === 'select' ? (
                  <div className="ctl" key={p.key}>
                    <label>{p.label}</label>
                    <select className="select" style={{ width: '100%' }} value={String(params[p.key] ?? p.default)} onChange={(e) => setParams((s) => ({ ...s, [p.key]: e.target.value }))}>
                      {p.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="help">{p.help}</div>
                  </div>
                ) : (
                  <Slider key={p.key} label={p.label} value={Number(params[p.key] ?? p.default)} min={p.min!} max={p.max!} step={p.step!}
                    help={p.help} onChange={(v) => setParams((s) => ({ ...s, [p.key]: v }))} />
                ),
              )}
              <button className="btn block" onClick={() => setParams(defaults(algo))}>Reset to defaults</button>
            </Card>
          )}
          <p className="small muted" style={{ margin: '0 .3rem' }}>The model retrains automatically on the Python backend whenever you change anything.</p>
        </aside>

        <main>
          <nav className="tabs">
            {TABS.map((t) => <button key={t.id} className={'tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>{t.label}</button>)}
          </nav>
          {err && <div style={{ marginBottom: '1rem' }}><Callout kind="warn">{err}</Callout></div>}
          {!meta && !err && <p className="muted">Connecting to the backend…</p>}
          {algo && tab === 'learn' && <Learn algo={algo} goTo={(t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
          {tab !== 'learn' && !fresh && !err && <p className="muted">Training the model…</p>}
          {tab !== 'learn' && fresh && run && (
            <div className={'fade' + (loading ? ' spinner' : '')} key={tab}>
              {tab === 'data' && <DataTab run={run} />}
              {tab === 'watch' && <Viz key={algoId + run.data.dataset} run={run} />}
              {tab === 'results' && <ResultsTab run={run} />}
            </div>
          )}
        </main>
      </div>}
    </>
  )
}
