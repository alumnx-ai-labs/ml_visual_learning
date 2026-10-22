import { useMemo } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { ChartNote, Guide, Narration } from '../components/Explain'
import { extent, HeatGrid, Plot, probColor } from '../components/Plot'
import { Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { VizProps } from '../types'

interface Round { k: number; train_pred: number[]; grid: number[]; train_loss: number; test_loss: number }

export function XgbViz({ run }: VizProps) {
  const R = run.result
  const rounds: Round[] = R.rounds
  const clf = run.task === 'classification'
  const p = usePlayer(rounds.length, 3)
  const cur = rounds[p.i]
  const prev = rounds[Math.max(0, p.i - 1)]
  const next = rounds[Math.min(p.i + 1, rounds.length - 1)]
  const a = axes(run)
  const { data } = run
  const trainIdx = useMemo(() => data.is_test.flatMap((t, i) => (t ? [] : [i])), [data.is_test])
  const xs: number[] = R.grid.xs
  const A = className(run, 0)
  const B = className(run, 1)
  const lr: number = R.lr

  const resid = trainIdx.map((i, j) => data.y[i] - cur.train_pred[j])
  const correction = xs.map((_, i) => (next.grid[i] - cur.grid[i]) / lr)
  const meanAbs = resid.reduce((s, v) => s + Math.abs(v), 0) / resid.length
  const allLoss = rounds.flatMap((r) => [r.train_loss, r.test_loss])
  const residDomain = extent(trainIdx.map((i, j) => data.y[i] - rounds[0].train_pred[j]))
  const best = rounds.reduce((bi, r, i) => (r.test_loss < rounds[bi].test_loss ? i : bi), 0)
  const wrongTrain = clf ? trainIdx.filter((i, j) => (cur.train_pred[j] > 0.5 ? 1 : 0) !== data.y[i]).length : 0
  const loss = R.loss_name as string

  const narration = (() => {
    if (cur.k === 0) {
      return {
        stage: 'Round 0 · starting guess', title: clf ? 'Every point gets a 50% chance.' : `Every point gets the same guess: the average, ${fmt(R.base, 2)}.`,
        lines: [
          clf
            ? 'No trees yet, so the model has no opinion: the whole chart is one flat colour.'
            : 'No trees yet, so the prediction is a flat line at the average. The red dashes are the **residuals**: how far each point is from that guess.',
          `Training ${loss}: **${fmt(cur.train_loss, 3)}**. Press **Next** to add the first tree.`,
        ],
      }
    }
    const overfit = cur.k > best + 2 && cur.test_loss > rounds[best].test_loss * 1.01
    const lines = [
      clf
        ? `Tree ${cur.k} looked at which points are still on the wrong side, or not confident enough, and pushed their scores the right way. ${wrongTrain} training points are still misclassified.`
        : `Tree ${cur.k} was trained to predict the residuals left after ${cur.k - 1} tree${cur.k === 2 ? '' : 's'}. Only ${Math.round(lr * 100)}% of its answer was added (**learning rate** ${lr}). Average remaining mistake: **${fmt(meanAbs, 2)}**.`,
      `Training ${loss} ${fmt(prev.train_loss, 3)} → ${fmt(cur.train_loss, 3)}; test ${loss} ${fmt(prev.test_loss, 3)} → ${fmt(cur.test_loss, 3)}.`,
    ]
    if (overfit) {
      return {
        stage: `Round ${cur.k} · overfitting`, tone: 'warn' as const,
        title: `The test ${loss} has been getting worse since tree ${best}.`,
        lines: [...lines, 'The new trees are now fixing random flukes in the training data instead of the real pattern (**overfitting**). Stopping at the best round is called **early stopping**.'],
      }
    }
    if (cur.k === rounds.length - 1) {
      return {
        stage: `Round ${cur.k} · finished`, tone: 'good' as const,
        title: `${cur.k} trees added. Best test ${loss} was at tree ${best}.`,
        lines: [...lines, 'Final prediction = starting guess + the scaled corrections from all trees added together. See **Results** for the full grade.'],
      }
    }
    const drop = prev.train_loss - cur.train_loss
    return {
      stage: `Round ${cur.k} · ${drop > rounds[1].train_loss * 0.05 ? 'big correction' : 'fine-tuning'}`,
      title: drop > 0 ? `This tree removed ${fmt(drop, 3)} of the training ${loss}.` : 'This tree changed very little.',
      lines,
    }
  })()

  return (
    <div className="stack">
      <Guide
        title="Watch trees being added one at a time"
        intro="XGBoost starts from a simple guess and adds small trees one after another. Each new tree fixes part of what is still wrong. Use **Next** to add one tree at a time."
        steps={[
          clf
            ? `**Chart 1** shows the prediction after the trees so far: blue background = ${A}, orange = ${B}, pale = unsure.`
            : '**Chart 1** shows the prediction after the trees so far (purple line). Red dashes are the mistakes still left (**residuals**).',
          clf
            ? '**Chart 2** explains what each new tree does for classification.'
            : '**Chart 2** shows exactly what the next tree is trained on: the leftover mistakes, plus the tree\'s answer to them (green).',
          '**Chart 3** tracks the error on training points and on hidden **test** points after each tree.',
          'The purple panel explains every round as it happens.',
        ]}
      />
      <PlayerBar p={p} label={(i) => `${i} of ${rounds.length - 1} trees`} />
      <Narration {...narration} />

      <div className="grid2">
        <Card title={`1 · Prediction after ${cur.k} tree${cur.k === 1 ? '' : 's'}`}>
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
          <Legend items={clf ? pointLegend(run) : [{ color: 'var(--accent)', label: 'prediction so far' }, { color: 'var(--bad)', label: 'mistakes still left' }]} />
          <ChartNote
            read={clf
              ? `Dots are data points in their real class colour. The background is the model's chance of ${B} after ${cur.k} trees: strong colour = confident, pale = unsure.`
              : 'Dots are the data. The purple line is the prediction after the trees added so far; each red dash is how far a point still is from it.'}
            look={clf ? 'A flat colour at round 0, rough blocks after a few trees, then regions that follow the shape of the data.' : 'The purple line bending towards the data with every tree, and the red dashes getting shorter.'}
          />
        </Card>

        {!clf ? (
          <Card title={`2 · What tree ${cur.k + 1} learns from`}>
            <Plot xDomain={a.xDomain} yDomain={residDomain} xLabel={a.xLabel} yLabel="mistake left (real − predicted)" height={380}>
              {(ctx) => (
                <>
                  <line x1={0} x2={ctx.w} y1={ctx.sy(0)} y2={ctx.sy(0)} stroke="var(--muted)" strokeDasharray="4 3" />
                  {trainIdx.map((i, j) => <circle key={i} cx={ctx.sx(a.px[i])} cy={ctx.sy(resid[j])} r={3.6} fill="var(--bad)" opacity={0.75} />)}
                  {p.i < p.last && <polyline fill="none" stroke="var(--good)" strokeWidth={3}
                    points={xs.map((x, i) => `${ctx.sx(x)},${ctx.sy(correction[i])}`).join(' ')} />}
                </>
              )}
            </Plot>
            <Legend items={[{ color: 'var(--bad)', label: 'mistake left at each point' }, { color: 'var(--good)', label: 'next tree\'s answer' }]} />
            <ChartNote
              read="Each red dot is one training point's remaining mistake. Above the dashed zero line means the prediction is still too low; below means too high. The green staircase is the next small tree's attempt to predict these mistakes. Only a fraction of it (the **learning rate**) is added."
              look="The red dots flattening towards the zero line round after round: less and less is left to fix."
            />
          </Card>
        ) : (
          <Card title="2 · What each tree does here">
            <p>For yes/no problems the model keeps a running <b>score</b> for every point (its <b>log-odds</b>). The chance shown in chart 1 is that score squashed by the sigmoid.</p>
            <p>Each new tree looks at how wrong the current chances are (real label − predicted chance) and adds a small push: up for points that should be {B}, down for points that should be {A}.</p>
            <p>Early trees fix the obvious mistakes in big blocks. Later trees fine-tune the tricky points near the border between the classes.</p>
            <div className="callout">Right now: <b>{wrongTrain}</b> of {trainIdx.length} training points are on the wrong side.</div>
          </Card>
        )}
      </div>

      <Card title="3 · Training error vs test error, tree by tree">
        <Plot xDomain={[0, Math.max(1, rounds.length - 1)]} yDomain={[0, Math.max(...allLoss) * 1.05]} xLabel="number of trees" yLabel={loss} height={260}>
          {(ctx) => (
            <>
              <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4} points={rounds.map((r) => `${ctx.sx(r.k)},${ctx.sy(r.train_loss)}`).join(' ')} />
              <polyline fill="none" stroke="var(--c1)" strokeWidth={2.4} points={rounds.map((r) => `${ctx.sx(r.k)},${ctx.sy(r.test_loss)}`).join(' ')} />
              <line x1={ctx.sx(best)} x2={ctx.sx(best)} y1={0} y2={ctx.h} stroke="var(--good)" strokeDasharray="5 4" />
              <line x1={ctx.sx(cur.k)} x2={ctx.sx(cur.k)} y1={0} y2={ctx.h} stroke="var(--accent)" strokeWidth={2} />
            </>
          )}
        </Plot>
        <Legend items={[{ color: 'var(--c0)', label: 'training error' }, { color: 'var(--c1)', label: 'test error (hidden points)' }, { color: 'var(--good)', label: `best test result (tree ${best})` }]} />
        <ChartNote
          read={`Left–right: number of trees. Up–down: the error (${loss}; lower is better). Blue is measured on the points the model learns from, orange on the hidden test points. The purple line is the current round.`}
          look="Blue always keeps falling. Orange falls, then flattens, and may turn up. Where orange turns up, extra trees are memorising noise (overfitting), so stopping at the green line is best."
        />
      </Card>
    </div>
  )
}
