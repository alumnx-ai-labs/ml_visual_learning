import { useMemo } from 'react'
import type { RunResponse } from '../types'
import { axes, className, pointLegend, Points } from './DataPoints'
import { extent, HeatGrid, Plot, probColor } from './Plot'
import { Callout, Card, fmt, Kpi, Legend } from './ui'

const pct = (v: number) => `${fmt(v * 100, 1)}%`

function equation(run: RunResponse) {
  const R = run.result
  const f = run.data.feature_names
  if (run.data && R.model?.w !== undefined) return `${run.data.target_name} = ${fmt(R.model.w, 3)} × ${f[0]} + ${fmt(R.model.b, 3)}`
  if (R.model?.w1 !== undefined) return `P(${className(run, 1)}) = σ(${fmt(R.model.w1, 3)}·${f[0]} + ${fmt(R.model.w2, 3)}·${f[1]} + ${fmt(R.model.b, 3)})`
  return null
}

/** Final-model probability grid for the classification decision map. */
function finalGrid(run: RunResponse) {
  const R = run.result
  const a = axes(run)
  if (R.forest_grid) return { xs: R.grid.xs, ys: R.grid.ys, v: R.forest_grid }
  if (R.rounds) return { xs: R.grid.xs, ys: R.grid.ys, v: R.rounds[R.rounds.length - 1].grid }
  const n = 32
  const xs = Array.from({ length: n }, (_, i) => a.xDomain[0] + ((a.xDomain[1] - a.xDomain[0]) * i) / (n - 1))
  const ys = Array.from({ length: n }, (_, i) => a.yDomain[0] + ((a.yDomain[1] - a.yDomain[0]) * i) / (n - 1))
  const m = R.model
  return { xs, ys, v: ys.flatMap((y) => xs.map((x) => 1 / (1 + Math.exp(-(m.w1 * x + m.w2 * y + m.b))))) }
}

export function ResultsTab({ run }: { run: RunResponse }) {
  const R = run.result
  const { data } = run
  const reg = run.task === 'regression'
  const te = R.test_metrics
  const trm = R.train_metrics
  const testIdx = useMemo(() => data.is_test.flatMap((t, i) => (t ? [i] : [])), [data.is_test])
  const eq = equation(run)
  const a = axes(run)

  const gap = reg ? trm.r2 - te.r2 : trm.accuracy - te.accuracy
  const verdict =
    (reg ? te.r2 < 0.5 : te.accuracy < 0.75)
      ? { kind: 'warn' as const, text: 'The model does poorly even on data like what it trained on — it is probably too simple for this pattern (underfitting). Try a more flexible model or more depth/trees.' }
      : gap > 0.1
        ? { kind: 'warn' as const, text: `Training score is much better than test score (gap ${fmt(gap, 2)}). The model memorised some noise (overfitting). Try lowering depth, adding regularisation, or using fewer rounds.` }
        : { kind: 'good' as const, text: 'Training and test scores are close and good — the model learned a pattern that generalises to unseen points.' }

  return (
    <div className="stack">
      <Card title="How good is the model? (measured on the hidden test points)">
        <div className="kpis">
          {reg ? (
            <>
              <Kpi label="R² (test)" value={fmt(te.r2, 3)} hint="Grade from 0 to 1: how much of the error from 'just guess the average' the model removed. 1 = perfect, 0 = no better than guessing the average." />
              <Kpi label="RMSE (test)" value={fmt(te.rmse, 2)} hint={`Typical size of a mistake, in ${data.target_name} units. RMSE 4 = usually about 4 off.`} />
              <Kpi label="MAE (test)" value={fmt(te.mae, 2)} hint="Average mistake size, ignoring whether it was too high or too low." />
              <Kpi label="R² (train)" value={fmt(trm.r2, 3)} hint="Same grade on the points it learned from. Much higher than the test R² = memorising." />
            </>
          ) : (
            <>
              <Kpi label="Accuracy (test)" value={pct(te.accuracy)} hint="Share of test points classified correctly." />
              <Kpi label="Precision" value={pct(te.precision)} hint={`When it says ${className(run, 1)}, how often is it right?`} />
              <Kpi label="Recall" value={pct(te.recall)} hint={`Of all true ${className(run, 1)} points, how many did it catch?`} />
              <Kpi label="F1 score" value={fmt(te.f1, 3)} hint="One number combining precision and recall. High only if both are high." />
              <Kpi label="Accuracy (train)" value={pct(trm.accuracy)} hint="Score on the training points. Compare with test." />
            </>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}><Callout kind={verdict.kind}>{verdict.text}</Callout></div>
        {eq && <p style={{ marginTop: '1rem', marginBottom: 0 }}><b>The learned model:</b> <code>{eq}</code></p>}
        {R.oob_score !== undefined && R.oob_score !== null && <p className="small muted" style={{ marginTop: '.5rem', marginBottom: 0 }}>Out-of-bag score (free validation from rows each tree did not see): <b>{reg ? fmt(R.oob_score, 3) + ' R²' : pct(R.oob_score)}</b></p>}
      </Card>

      <div className="grid2">
        {reg ? (
          <Card title="Predicted vs actual (test points)">
            {(() => {
              const pred: number[] = R.predictions.test
              const act = testIdx.map((i) => data.y[i])
              const d = extent([...pred, ...act])
              return (
                <Plot xDomain={d} yDomain={d} xLabel={`actual ${data.target_name}`} yLabel={`predicted ${data.target_name}`} height={360}>
                  {(ctx) => (
                    <>
                      <line x1={ctx.sx(d[0])} y1={ctx.sy(d[0])} x2={ctx.sx(d[1])} y2={ctx.sy(d[1])} stroke="var(--good)" strokeWidth={2} strokeDasharray="6 4" />
                      {act.map((v, j) => <circle key={j} cx={ctx.sx(v)} cy={ctx.sy(pred[j])} r={4.5} fill="var(--c0)" opacity={0.8} />)}
                    </>
                  )}
                </Plot>
              )
            })()}
            <p className="small muted" style={{ margin: 0 }}>A perfect model puts every dot on the dashed diagonal. Vertical distance from it = that point's error.</p>
          </Card>
        ) : (
          <Card title="Confusion matrix (test points)">
            <p className="small muted">Rows = the truth, columns = what the model said. The diagonal (green) are correct answers.</p>
            <table className="data" style={{ maxWidth: 420 }}>
              <thead><tr><th>truth ↓ / predicted →</th><th>{className(run, 0)}</th><th>{className(run, 1)}</th></tr></thead>
              <tbody>
                {te.confusion.map((row: number[], r: number) => (
                  <tr key={r}>
                    <th style={{ textAlign: 'left' }}>{className(run, r)}</th>
                    {row.map((v, c) => (
                      <td key={c} style={{ fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', background: r === c ? 'color-mix(in srgb, var(--good) 18%, transparent)' : v ? 'color-mix(in srgb, var(--bad) 15%, transparent)' : undefined }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small" style={{ marginTop: '.8rem' }}>
              Bottom-left = <b>false negatives</b> (missed {className(run, 1)}), top-right = <b>false positives</b> (wrongly called {className(run, 1)}).
            </p>
          </Card>
        )}

        <Card title={reg ? 'Final model over the data' : 'Final decision map (test points as rings)'}>
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={360}>
            {(ctx) => {
              if (!reg) {
                const g = finalGrid(run)
                return (<><HeatGrid xs={g.xs} ys={g.ys} values={g.v} ctx={ctx} color={probColor} /><Points run={run} ctx={ctx} /></>)
              }
              const curve: [number, number][] = R.model?.w !== undefined
                ? [a.xDomain[0], a.xDomain[1]].map((x) => [x, R.model.w * x + R.model.b])
                : R.grid.xs.map((x: number, i: number) => [x, R.forest_grid ? R.forest_grid[i] : R.rounds[R.rounds.length - 1].grid[i]])
              return (
                <>
                  <Points run={run} ctx={ctx} />
                  <polyline fill="none" stroke="var(--accent)" strokeWidth={3} points={curve.map(([x, y]) => `${ctx.sx(x)},${ctx.sy(y)}`).join(' ')} />
                </>
              )
            }}
          </Plot>
          <Legend items={pointLegend(run)} />
        </Card>
      </div>

      {R.importance && data.feature_names.length > 1 && (
        <Card title="Feature importance">
          <p className="small muted">How much each feature helped the trees make good splits (sums to 100%).</p>
          {data.feature_names.map((f, i) => (
            <div key={f} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', gap: '.6rem', alignItems: 'center', marginBottom: '.4rem' }}>
              <span className="small">{f}</span>
              <div style={{ background: 'var(--panel2)', borderRadius: 6, height: 14 }}>
                <div style={{ width: pct(R.importance[i]), height: '100%', background: 'var(--accent)', borderRadius: 6 }} />
              </div>
              <b className="small">{pct(R.importance[i])}</b>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
