import { useMemo, useState } from 'react'
import { axes, Points } from '../components/DataPoints'
import { HeatGrid, Plot } from '../components/Plot'
import { Callout, Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { VizProps } from '../types'

export function LinearViz({ run }: VizProps) {
  const R = run.result
  const path: { step: number; w: number; b: number; loss: number }[] = R.gd.path
  const p = usePlayer(path.length, 10)
  const f = path[p.i]
  const a = axes(run)
  const { data } = run
  const trainIdx = useMemo(() => data.is_test.flatMap((t, i) => (t ? [] : [i])), [data.is_test])
  const [pick, setPick] = useState<number | null>(null)
  const k = pick ?? trainIdx[0]
  const xk = data.X[k][0]
  const yk = data.y[k]
  const yhat = f.w * xk + f.b

  const { ws, bs, z } = R.surface as { ws: number[]; bs: number[]; z: number[][] }
  const flat = z.flat()
  const lo = Math.log(Math.max(Math.min(...flat), 1e-3))
  const hi = Math.log(Math.max(...flat))
  const heat = (v: number) => `color-mix(in srgb, var(--accent) ${Math.round(100 * (1 - (Math.log(Math.max(v, 1e-3)) - lo) / (hi - lo || 1)))}%, var(--panel))`
  const lossMax = Math.max(...path.map((q) => q.loss))
  const m = R.model

  return (
    <div className="stack">
      <PlayerBar p={p} label={(i) => `step ${path[i].step}`} />
      {R.gd.diverged && (
        <Callout kind="warn"><b>The loss exploded.</b> The learning rate is too large: each step overshoots the valley and lands higher up the other wall. Lower the learning rate in the left panel.</Callout>
      )}

      <div className="grid2">
        <Card title="1 · The line and its mistakes">
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={380}>
            {(ctx) => (
              <>
                {trainIdx.map((i) => (
                  <line key={i} x1={ctx.sx(a.px[i])} x2={ctx.sx(a.px[i])} y1={ctx.sy(a.py[i])} y2={ctx.sy(f.w * a.px[i] + f.b)}
                    stroke="var(--bad)" strokeWidth={1.4} strokeDasharray="3 2" opacity={0.75} />
                ))}
                <line x1={ctx.sx(a.xDomain[0])} x2={ctx.sx(a.xDomain[1])} y1={ctx.sy(m.w * a.xDomain[0] + m.b)} y2={ctx.sy(m.w * a.xDomain[1] + m.b)}
                  stroke="var(--good)" strokeWidth={2} strokeDasharray="7 5" opacity={0.8} />
                <line x1={ctx.sx(a.xDomain[0])} x2={ctx.sx(a.xDomain[1])} y1={ctx.sy(f.w * a.xDomain[0] + f.b)} y2={ctx.sy(f.w * a.xDomain[1] + f.b)}
                  stroke="var(--accent)" strokeWidth={3.2} />
                <Points run={run} ctx={ctx} show="train" selected={k} onSelect={setPick} />
              </>
            )}
          </Plot>
          <Legend items={[
            { color: 'var(--accent)', label: 'current line' },
            { color: 'var(--good)', label: 'exact best line (formula)' },
            { color: 'var(--bad)', label: 'residuals (mistakes)' },
          ]} />
        </Card>

        <Card title="2 · Rolling down the loss bowl">
          <Plot xDomain={[ws[0], ws[ws.length - 1]]} yDomain={[bs[0], bs[bs.length - 1]]} xLabel="slope w" yLabel="intercept b" height={380}>
            {(ctx) => (
              <>
                <HeatGrid xs={ws} ys={bs} values={flat} ctx={ctx} color={heat} opacity={0.85} />
                <polyline fill="none" stroke="var(--ink)" strokeWidth={1.6}
                  points={path.slice(0, p.i + 1).map((q) => `${ctx.sx(q.w)},${ctx.sy(q.b)}`).join(' ')} />
                <circle cx={ctx.sx(m.w)} cy={ctx.sy(m.b)} r={6} fill="none" stroke="var(--good)" strokeWidth={2.5} />
                <circle cx={ctx.sx(f.w)} cy={ctx.sy(f.b)} r={6} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
              </>
            )}
          </Plot>
          <Legend items={[{ color: 'var(--accent)', label: 'current (w, b)' }, { color: 'var(--good)', label: 'true minimum', ring: true }]} />
          <p className="small muted" style={{ margin: '.4rem 0 0' }}>Every location on this map is one possible line. Darker = lower loss. Gradient descent walks downhill.</p>
        </Card>
      </div>

      <div className="grid2">
        <Card title="3 · Loss going down">
          <Plot xDomain={[0, path[path.length - 1].step || 1]} yDomain={[0, lossMax * 1.05]} xLabel="gradient step" yLabel="MSE loss" height={300}>
            {(ctx) => (
              <>
                <polyline fill="none" stroke="var(--c0)" strokeWidth={2.2} points={path.map((q) => `${ctx.sx(q.step)},${ctx.sy(q.loss)}`).join(' ')} />
                <circle cx={ctx.sx(f.step)} cy={ctx.sy(f.loss)} r={5.5} fill="var(--accent)" />
              </>
            )}
          </Plot>
        </Card>

        <Card title="What is happening right now">
          <Callout>
            <b>Step {f.step}:</b> the line is <b>ŷ = {fmt(f.w, 2)}·x + {fmt(f.b, 2)}</b> and the average squared mistake (MSE) is <b>{fmt(f.loss, 1)}</b>.
            {f.step === 0 && ' We start from a flat line at zero, so every point is badly missed.'}
            {f.step > 0 && p.i === p.last && ' We stopped here. Compare it to the exact formula answer (dashed green): ' + `w* = ${fmt(m.w, 2)}, b* = ${fmt(m.b, 2)}.`}
          </Callout>
          <h4 style={{ marginTop: '1rem' }}>Worked example — one data point <span className="small muted">(click a dot in chart 1 to change)</span></h4>
          <p className="small" style={{ margin: 0 }}>
            Point #{k}: x = {fmt(xk, 2)}, actual y = {fmt(yk, 2)}<br />
            Prediction: ŷ = {fmt(f.w, 2)} × {fmt(xk, 2)} + {fmt(f.b, 2)} = <b>{fmt(yhat, 2)}</b><br />
            Residual: y − ŷ = {fmt(yk, 2)} − {fmt(yhat, 2)} = <b>{fmt(yk - yhat, 2)}</b><br />
            Squared: <b>{fmt((yk - yhat) ** 2, 2)}</b> — the MSE is the average of this number over all {trainIdx.length} training points.
          </p>
        </Card>
      </div>
    </div>
  )
}
