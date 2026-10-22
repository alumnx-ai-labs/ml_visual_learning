import { useMemo, useState } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { ChartNote, Guide, Narration } from '../components/Explain'
import { HeatGrid, Plot, probColor } from '../components/Plot'
import { Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { RunResponse, VizProps } from '../types'

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
  const A = className(run, 0)
  const B = className(run, 1)
  const [f1, f2] = data.feature_names

  const xs = useMemo(() => linspace(a.xDomain[0], a.xDomain[1], 32), [a.xDomain])
  const ys = useMemo(() => linspace(a.yDomain[0], a.yDomain[1], 32), [a.yDomain])
  const grid = useMemo(() => ys.flatMap((y) => xs.map((x) => sigmoid(f.w1 * x + f.w2 * y + f.b))), [xs, ys, f])

  const z = f.w1 * data.X[pick][0] + f.w2 * data.X[pick][1] + f.b
  const prob = sigmoid(z)
  const maxLoss = Math.max(...path.map((q) => q.loss))
  const hasLine = Math.abs(f.w1) + Math.abs(f.w2) > 1e-9
  const wrong = data.X.filter((r, i) => !data.is_test[i] && (sigmoid(f.w1 * r[0] + f.w2 * r[1] + f.b) > 0.5 ? 1 : 0) !== data.y[i]).length

  const boundary = (sx: (v: number) => number, sy: (v: number) => number) => {
    if (Math.abs(f.w2) > 1e-9) {
      const y0 = -(f.w1 * a.xDomain[0] + f.b) / f.w2
      const y1 = -(f.w1 * a.xDomain[1] + f.b) / f.w2
      return { x1: sx(a.xDomain[0]), y1: sy(y0), x2: sx(a.xDomain[1]), y2: sy(y1) }
    }
    const x = -f.b / f.w1
    return { x1: sx(x), y1: sy(a.yDomain[0]), x2: sx(x), y2: sy(a.yDomain[1]) }
  }

  return (
    <div className="stack">
      <Guide
        title="Watch the dividing line find its place"
        intro={`The model learns a straight line that separates **${A}** from **${B}**, and a chance (**probability**) for every point. Use **Play** or **Next** at the top.`}
        steps={[
          `**Chart 1** shows the training points, the current dividing line (black) and the model's confidence as background colour: blue = ${A}, orange = ${B}, pale = unsure.`,
          '**Chart 2** tracks the **log loss** (how wrong and how over-confident) after each step.',
          '**Chart 3** shows how one point\'s score is squashed into a probability by the **sigmoid** curve. Click any dot in chart 1 to follow that point.',
          'The purple panel explains each step as it happens.',
        ]}
      />
      <PlayerBar p={p} label={(i) => `step ${path[i].step} of ${path[path.length - 1].step}`} />
      <Narration {...narrate(path, p.i, wrong, run)} />

      <div className="grid2">
        <Card title="1 · The dividing line moving">
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={400}>
            {(ctx) => (
              <>
                <HeatGrid xs={xs} ys={ys} values={grid} ctx={ctx} color={probColor} />
                {hasLine && <line {...boundary(ctx.sx, ctx.sy)} stroke="var(--ink)" strokeWidth={2.6} />}
                <Points run={run} ctx={ctx} show="train" selected={pick} onSelect={setPick} />
              </>
            )}
          </Plot>
          <Legend items={pointLegend(run).slice(0, 2).concat([{ color: 'var(--ink)', label: 'decision boundary (50/50)' }])} />
          <ChartNote
            read={`Each dot is a training point at (${f1}, ${f2}); its colour is its true class. The black line is the **decision boundary**: the model says ${B} on one side and ${A} on the other. The background shows the model's chance of ${B} at every spot: strong colour = confident, pale = unsure.`}
            look="The line rotating and sliding until most blue dots are on the blue side and most orange dots on the orange side. Later the colours get stronger, which means the model is growing more confident."
          />
        </Card>

        <div className="stack">
          <Card title="2 · How wrong the model is">
            <Plot xDomain={[0, path[path.length - 1].step || 1]} yDomain={[0, Math.max(maxLoss, 1) * 1.05]} xLabel="gradient descent step" yLabel="log loss" height={220}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c5)" strokeWidth={2.2} points={path.map((q) => `${ctx.sx(q.step)},${ctx.sy(q.loss)}`).join(' ')} />
                  <circle cx={ctx.sx(f.step)} cy={ctx.sy(f.loss)} r={5.5} fill="var(--accent)" />
                </>
              )}
            </Plot>
            <ChartNote
              read="Left–right: steps taken. Up–down: **log loss**. It starts at 0.69, the score of answering 50/50 for everyone, and lower is better."
              look="A fast drop while the line moves into place, then a slow decline as the model becomes more confident."
            />
          </Card>

          <Card title={`3 · From score to chance (point #${pick})`}>
            <Plot xDomain={[-7, 7]} yDomain={[-0.05, 1.05]} xLabel="score z" yLabel={`chance of ${B}`} height={200}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4}
                    points={linspace(-7, 7, 80).map((t) => `${ctx.sx(t)},${ctx.sy(sigmoid(t))}`).join(' ')} />
                  <line x1={ctx.sx(0)} x2={ctx.sx(0)} y1={0} y2={ctx.h} stroke="var(--muted)" strokeDasharray="4 3" />
                  <circle cx={ctx.sx(Math.max(-7, Math.min(7, z)))} cy={ctx.sy(prob)} r={6} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
                </>
              )}
            </Plot>
            <table className="ex" style={{ width: '100%', marginTop: '.5rem' }}>
              <tbody>
                <tr><td>Point #{pick}</td><td>{f1} = {fmt(data.X[pick][0], 2)}, {f2} = {fmt(data.X[pick][1], 2)}, really <b>{className(run, data.y[pick])}</b></td></tr>
                <tr><td>1. Score</td><td>z = {fmt(f.w1, 2)} × {fmt(data.X[pick][0], 2)} + {fmt(f.w2, 2)} × {fmt(data.X[pick][1], 2)} + {fmt(f.b, 2)} = <b>{fmt(z, 2)}</b></td></tr>
                <tr><td>2. Squash</td><td>sigmoid({fmt(z, 2)}) = <b>{fmt(prob * 100, 1)}%</b> chance of {B}</td></tr>
                <tr><td>3. Decide</td><td>{prob > 0.5 ? 'above' : 'below'} 50% → <b>{className(run, prob > 0.5 ? 1 : 0)}</b> {(prob > 0.5 ? 1 : 0) === data.y[pick] ? '(correct)' : '(wrong)'}</td></tr>
              </tbody>
            </table>
            <ChartNote read="The S-curve is the **sigmoid**. Left of the dashed line (score below 0) the model leans towards the first class, right of it towards the second. The further from 0, the more sure." />
          </Card>
        </div>
      </div>
    </div>
  )
}

function narrate(path: Frame[], i: number, wrong: number, run: RunResponse) {
  const f = path[i]
  const prev = path[Math.max(0, i - 1)]
  const nTrain = run.data.n_train
  const sharp = Math.hypot(f.w1, f.w2)
  if (i === 0) {
    return {
      stage: 'Step 0 · starting guess', title: 'The model has no opinion yet.',
      lines: [
        'All the **weights** are 0, so every point gets a score of 0, which the **sigmoid** turns into exactly 50%. That is why the background is one flat colour and there is no line yet.',
        `Answering 50/50 for everyone gives a **log loss** of ${fmt(f.loss, 3)}. Press **Play** or **Next** to start.`,
      ],
    }
  }
  if (i === path.length - 1) {
    const good = run.result.test_metrics.accuracy >= 0.85
    return {
      stage: `Step ${f.step} · finished`, tone: good ? ('good' as const) : ('warn' as const),
      title: `${nTrain - wrong} of ${nTrain} training points are on the correct side (${fmt(f.acc * 100, 1)}%).`,
      lines: good
        ? [`The log loss fell to ${fmt(f.loss, 3)}. The line separates the classes well, and the background colour shows how sure the model is in each area.`, 'Open **Results** to see how it does on the hidden test points.']
        : [`${wrong} training points are still on the wrong side, and more steps will not fix that. The classes are not arranged so that a straight line can split them.`, 'This is the limit of logistic regression. Try the same dataset with **Random Forest** or **XGBoost**.'],
    }
  }
  const lossDrop = prev.loss - f.loss
  if (lossDrop > 0.004) {
    return {
      stage: `Step ${f.step} · moving into place`, title: `${wrong} training points on the wrong side · accuracy ${fmt(f.acc * 100, 1)}%`,
      lines: [
        `Log loss ${fmt(prev.loss, 3)} → ${fmt(f.loss, 3)}. Points on the wrong side pull hardest, by how wrong their **probability** is, and that pull rotates and shifts the line.`,
        'Watch the black line in chart 1: each step it turns towards the position that puts more points on their own side.',
      ],
    }
  }
  return {
    stage: `Step ${f.step} · getting more confident`, title: `The line has mostly settled · ${wrong} points on the wrong side`,
    lines: [
      `The line's position barely changes now. Instead the **weights** keep growing (size ${fmt(sharp, 2)}), which makes the probabilities more extreme: the background colours get stronger.`,
      `Log loss is still creeping down (${fmt(f.loss, 3)}) because confident correct answers cost less than unsure ones.`,
    ],
  }
}
