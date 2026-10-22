import { useMemo } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { extent, HeatGrid, Plot, probColor } from '../components/Plot'
import { Callout, Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { VizProps } from '../types'

interface Round { k: number; train_pred: number[]; grid: number[]; train_loss: number; test_loss: number }

export function XgbViz({ run }: VizProps) {
  const R = run.result
  const rounds: Round[] = R.rounds
  const clf = run.task === 'classification'
  const p = usePlayer(rounds.length, 3)
  const cur = rounds[p.i]
  const next = rounds[Math.min(p.i + 1, rounds.length - 1)]
  const a = axes(run)
  const { data } = run
  const trainIdx = useMemo(() => data.is_test.flatMap((t, i) => (t ? [] : [i])), [data.is_test])
  const xs: number[] = R.grid.xs

  // residual = what is still wrong after the first k trees; the next tree is trained to predict exactly this
  const resid = trainIdx.map((i, j) => data.y[i] - cur.train_pred[j])
  const correction = xs.map((_, i) => (next.grid[i] - cur.grid[i]) / R.lr)
  const meanAbs = resid.reduce((s, v) => s + Math.abs(v), 0) / resid.length
  const allLoss = rounds.flatMap((r) => [r.train_loss, r.test_loss])
  const residDomain = extent(trainIdx.map((i, j) => data.y[i] - rounds[0].train_pred[j]))

  return (
    <div className="stack">
      <PlayerBar p={p} label={(i) => `${i} tree${i === 1 ? '' : 's'}`} />
      <Callout>
        {cur.k === 0
          ? <>Round 0: no trees yet. The model's starting guess is <b>{clf ? '50 % for every point' : `the average target, ${fmt(R.base, 2)}`}</b> for everyone.</>
          : <>After <b>{cur.k}</b> tree{cur.k > 1 ? 's' : ''}: each tree added a correction × learning rate {R.lr}. Training {R.loss_name} = <b>{fmt(cur.train_loss, 3)}</b>, test {R.loss_name} = <b>{fmt(cur.test_loss, 3)}</b>.</>}
        {!clf && <> Average remaining mistake: <b>{fmt(meanAbs, 2)}</b>.</>}
      </Callout>

      <div className="grid2">
        <Card title={clf ? '1 · Prediction after k trees' : '1 · Prediction after k trees (and the remaining mistakes)'}>
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={380}>
            {(ctx) => clf ? (
              <>
                <HeatGrid xs={xs} ys={R.grid.ys} values={cur.grid} ctx={ctx} color={probColor} opacity={0.35} />
                <Points run={run} ctx={ctx} />
              </>
            ) : (
              <>
                {trainIdx.map((i, j) => (
                  <line key={i} x1={ctx.sx(a.px[i])} x2={ctx.sx(a.px[i])} y1={ctx.sy(data.y[i])} y2={ctx.sy(cur.train_pred[j])}
                    stroke="var(--bad)" strokeDasharray="3 2" strokeWidth={1.3} opacity={0.7} />
                ))}
                <Points run={run} ctx={ctx} />
                <polyline fill="none" stroke="var(--accent)" strokeWidth={3}
                  points={xs.map((x, i) => `${ctx.sx(x)},${ctx.sy(cur.grid[i])}`).join(' ')} />
              </>
            )}
          </Plot>
          <Legend items={clf ? pointLegend(run) : [{ color: 'var(--accent)', label: 'ensemble prediction' }, { color: 'var(--bad)', label: 'residuals still left' }]} />
          {clf && <p className="small muted" style={{ margin: '.3rem 0 0' }}>Colour = predicted probability of {className(run, 1)}. Press play: the regions sharpen as trees pile up.</p>}
        </Card>

        {!clf ? (
          <Card title={`2 · What tree #${cur.k + 1} is trained on`}>
            <Plot xDomain={a.xDomain} yDomain={residDomain} xLabel={a.xLabel} yLabel="residual (actual − predicted)" height={380}>
              {(ctx) => (
                <>
                  <line x1={0} x2={ctx.w} y1={ctx.sy(0)} y2={ctx.sy(0)} stroke="var(--muted)" strokeDasharray="4 3" />
                  {trainIdx.map((i, j) => <circle key={i} cx={ctx.sx(a.px[i])} cy={ctx.sy(resid[j])} r={3.6} fill="var(--bad)" opacity={0.75} />)}
                  {p.i < p.last && <polyline fill="none" stroke="var(--good)" strokeWidth={3}
                    points={xs.map((x, i) => `${ctx.sx(x)},${ctx.sy(correction[i])}`).join(' ')} />}
                </>
              )}
            </Plot>
            <Legend items={[{ color: 'var(--bad)', label: 'residual of each training point' }, { color: 'var(--good)', label: 'next tree\'s fit to them (before × learning rate)' }]} />
            <p className="small muted" style={{ margin: '.3rem 0 0' }}>The next small tree only has to learn these leftover errors — a much easier job than learning the whole pattern. Watch the dots flatten toward zero.</p>
          </Card>
        ) : (
          <Card title="2 · Why it works: each tree fixes errors">
            <p>For classification, XGBoost keeps a running <b>score</b> (log-odds) for each point. Every tree adds a small push: up for points that should be {className(run, 1)} but are not yet confident, down for {className(run, 0)}.</p>
            <p>The probability is σ(score). Early rounds make big, rough moves; later rounds fine-tune the tricky points near the boundary.</p>
            <Callout>Use the player: at round 0 everything is 50 / 50 (flat colour). By the last round the colours follow the data's shape.</Callout>
          </Card>
        )}
      </div>

      <Card title="3 · Training vs test loss, round by round">
        <Plot xDomain={[0, Math.max(1, rounds.length - 1)]} yDomain={[0, Math.max(...allLoss) * 1.05]} xLabel="number of trees" yLabel={R.loss_name} height={260}>
          {(ctx) => (
            <>
              <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4} points={rounds.map((r) => `${ctx.sx(r.k)},${ctx.sy(r.train_loss)}`).join(' ')} />
              <polyline fill="none" stroke="var(--c1)" strokeWidth={2.4} points={rounds.map((r) => `${ctx.sx(r.k)},${ctx.sy(r.test_loss)}`).join(' ')} />
              <line x1={ctx.sx(cur.k)} x2={ctx.sx(cur.k)} y1={0} y2={ctx.h} stroke="var(--accent)" strokeWidth={2} />
            </>
          )}
        </Plot>
        <Legend items={[{ color: 'var(--c0)', label: 'training loss' }, { color: 'var(--c1)', label: 'test loss' }]} />
        <p className="small muted" style={{ margin: '.3rem 0 0' }}>Training loss always keeps falling. If the test loss flattens or rises while training loss falls, extra trees are memorising noise (overfitting) — try a smaller learning rate or fewer rounds.</p>
      </Card>
    </div>
  )
}
