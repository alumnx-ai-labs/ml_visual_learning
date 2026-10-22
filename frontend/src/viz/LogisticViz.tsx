import { useMemo, useState } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { HeatGrid, Plot, probColor } from '../components/Plot'
import { Callout, Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { VizProps } from '../types'

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const linspace = (lo: number, hi: number, n: number) => Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1))

interface Frame { step: number; w1: number; w2: number; b: number; loss: number; acc: number }

export function LogisticViz({ run }: VizProps) {
  const R = run.result
  const path: Frame[] = R.gd.path
  const p = usePlayer(path.length, 8)
  const f = path[p.i]
  const a = axes(run)
  const { data } = run
  const [pick, setPick] = useState(0)

  const xs = useMemo(() => linspace(a.xDomain[0], a.xDomain[1], 32), [a.xDomain])
  const ys = useMemo(() => linspace(a.yDomain[0], a.yDomain[1], 32), [a.yDomain])
  const grid = useMemo(() => ys.flatMap((y) => xs.map((x) => sigmoid(f.w1 * x + f.w2 * y + f.b))), [xs, ys, f])

  const z = f.w1 * data.X[pick][0] + f.w2 * data.X[pick][1] + f.b
  const prob = sigmoid(z)
  const maxLoss = Math.max(...path.map((q) => q.loss))

  // the boundary w1*x + w2*y + b = 0, clipped to the visible window
  const boundary = (sx: (v: number) => number, sy: (v: number) => number) => {
    if (Math.abs(f.w2) > 1e-9) {
      const y0 = -(f.w1 * a.xDomain[0] + f.b) / f.w2
      const y1 = -(f.w1 * a.xDomain[1] + f.b) / f.w2
      return { x1: sx(a.xDomain[0]), y1: sy(y0), x2: sx(a.xDomain[1]), y2: sy(y1) }
    }
    const x = -f.b / (f.w1 || 1e-9)
    return { x1: sx(x), y1: sy(a.yDomain[0]), x2: sx(x), y2: sy(a.yDomain[1]) }
  }

  return (
    <div className="stack">
      <PlayerBar p={p} label={(i) => `step ${path[i].step}`} />
      <div className="grid2">
        <Card title="1 · The boundary moving">
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={400}>
            {(ctx) => {
              const b = boundary(ctx.sx, ctx.sy)
              return (
                <>
                  <HeatGrid xs={xs} ys={ys} values={grid} ctx={ctx} color={probColor} />
                  <line {...b} stroke="var(--ink)" strokeWidth={2.6} />
                  <Points run={run} ctx={ctx} show="train" selected={pick} onSelect={setPick} />
                </>
              )
            }}
          </Plot>
          <Legend items={pointLegend(run).slice(0, 2).concat([{ color: 'var(--ink)', label: 'decision boundary (50 / 50)' }])} />
          <p className="small muted" style={{ margin: '.4rem 0 0' }}>Background colour = predicted probability of {className(run, 1)} (blue-ish → {className(run, 0)}, orange-ish → {className(run, 1)}).</p>
        </Card>

        <div className="stack">
          <Card title="2 · Loss & accuracy">
            <Plot xDomain={[0, path[path.length - 1].step || 1]} yDomain={[0, Math.max(maxLoss, 1) * 1.05]} xLabel="gradient step" yLabel="log loss" height={240}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c5)" strokeWidth={2.2} points={path.map((q) => `${ctx.sx(q.step)},${ctx.sy(q.loss)}`).join(' ')} />
                  <circle cx={ctx.sx(f.step)} cy={ctx.sy(f.loss)} r={5.5} fill="var(--accent)" />
                </>
              )}
            </Plot>
            <Callout>
              <b>Step {f.step}:</b> log loss {fmt(f.loss, 3)}, training accuracy <b>{fmt(f.acc * 100, 1)}%</b>.
              {run.result.test_metrics.accuracy < 0.8 && p.i === p.last && ' A straight line struggles with this shape of data — this is the limit of logistic regression. Try a tree-based model.'}
            </Callout>
          </Card>

          <Card title={`3 · From position to probability (point #${pick})`}>
            <Plot xDomain={[-7, 7]} yDomain={[-0.05, 1.05]} xLabel="score z = w₁x₁ + w₂x₂ + b" yLabel={`P(${className(run, 1)})`} height={230}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4}
                    points={linspace(-7, 7, 80).map((t) => `${ctx.sx(t)},${ctx.sy(sigmoid(t))}`).join(' ')} />
                  <line x1={ctx.sx(0)} x2={ctx.sx(0)} y1={0} y2={ctx.h} stroke="var(--muted)" strokeDasharray="4 3" />
                  <circle cx={ctx.sx(Math.max(-7, Math.min(7, z)))} cy={ctx.sy(prob)} r={6} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
                </>
              )}
            </Plot>
            <p className="small" style={{ margin: 0 }}>
              Point #{pick} = ({fmt(data.X[pick][0], 2)}, {fmt(data.X[pick][1], 2)}) is truly <b>{className(run, data.y[pick])}</b>.
              z = {fmt(f.w1, 2)}·{fmt(data.X[pick][0], 2)} + {fmt(f.w2, 2)}·{fmt(data.X[pick][1], 2)} + {fmt(f.b, 2)} = <b>{fmt(z, 2)}</b> →
              σ(z) = <b>{fmt(prob * 100, 1)}%</b> chance of {className(run, 1)} → predicts <b>{className(run, prob > 0.5 ? 1 : 0)}</b>
              {(prob > 0.5 ? 1 : 0) === data.y[pick] ? ' (correct)' : ' (wrong)'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
