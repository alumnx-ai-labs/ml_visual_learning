import { axes, Points } from '../components/DataPoints'
import { HeatGrid, Plot, probColor, classColor } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, Deck, pct, Recap, trainOf, useRuns, type SlideDef } from './common'

interface Frame { step: number; w1: number; w2: number; b: number; loss: number; acc: number }
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const lin = (lo: number, hi: number, n: number) => Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1))

export function LogisticDeck() {
  const { runs, err } = useRuns([
    { algo: 'logistic', dataset: 'exam', n: 160 },
    { algo: 'logistic', dataset: 'moons', n: 200 },
  ])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="Logistic Regression" slides={build(runs[0], runs[1])} />
}

/** Background probability + boundary + points, for any set of weights. */
function Board({ run, f, show = 'train', label, heat = true, highlight }: {
  run: RunResponse; f: { w1: number; w2: number; b: number }; show?: 'train' | 'test' | 'all'; label?: string; heat?: boolean; highlight?: number[]
}) {
  const a = axes(run)
  const xs = lin(a.xDomain[0], a.xDomain[1], 30)
  const ys = lin(a.yDomain[0], a.yDomain[1], 30)
  const grid = ys.flatMap((y) => xs.map((x) => sigmoid(f.w1 * x + f.w2 * y + f.b)))
  const hasLine = Math.abs(f.w1) + Math.abs(f.w2) > 1e-9
  const names = run.data.feature_names.map((n) => n.replace(/_/g, ' '))
  return (
    <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={names[0]} yLabel={names[1]} height={400}>
      {(c) => {
        let line = null
        if (hasLine) {
          if (Math.abs(f.w2) > 1e-9) {
            const y0 = -(f.w1 * a.xDomain[0] + f.b) / f.w2
            const y1 = -(f.w1 * a.xDomain[1] + f.b) / f.w2
            line = <line x1={c.sx(a.xDomain[0])} y1={c.sy(y0)} x2={c.sx(a.xDomain[1])} y2={c.sy(y1)} stroke="var(--ink)" strokeWidth={3} />
          } else {
            const x = -f.b / f.w1
            line = <line x1={c.sx(x)} y1={0} x2={c.sx(x)} y2={c.h} stroke="var(--ink)" strokeWidth={3} />
          }
        }
        return (
          <>
            {heat && <HeatGrid xs={xs} ys={ys} values={grid} ctx={c} color={probColor} opacity={0.32} />}
            {line}
            <Points run={run} ctx={c} show={show} radius={5} />
            {highlight?.map((i) => <circle key={i} cx={c.sx(a.px[i])} cy={c.sy(a.py[i])} r={11} fill="none" stroke="var(--bad)" strokeWidth={2.5} />)}
            {label && <ChartLabel>{label}</ChartLabel>}
          </>
        )
      }}
    </Plot>
  )
}

export function build(run: RunResponse, moons: RunResponse): SlideDef[] {
  const R = run.result
  const path: Frame[] = R.gd.path
  const m = R.model as { w1: number; w2: number; b: number }
  const tr = trainOf(run)
  const { data } = run
  const zOf = (i: number) => m.w1 * data.X[i][0] + m.w2 * data.X[i][1] + m.b
  const byZ = [...tr].sort((i, j) => zOf(i) - zOf(j))
  const examples = [byZ[Math.floor(byZ.length * 0.05)], byZ.reduce((bi, i) => (Math.abs(zOf(i)) < Math.abs(zOf(bi)) ? i : bi), byZ[0]), byZ[Math.floor(byZ.length * 0.95)]]
  const wrong = tr.filter((i) => (zOf(i) > 0 ? 1 : 0) !== data.y[i])
  const legend = <Legend items={[{ color: classColor(0), label: 'failed' }, { color: classColor(1), label: 'passed' }]} />
  const T = R.test_metrics

  return [
    {
      title: 'Who will pass the exam?',
      text: [
        'Each dot is a student from last year: hours studied (left to right) and hours slept the night before (bottom to top). Blue dots failed, orange dots passed.',
        'For a new student we want to answer a yes/no question: pass or fail? Predicting a category like this is called **classification**.',
      ],
      visual: () => <>{<Board run={run} f={{ w1: 0, w2: 0, b: 0 }} heat={false} />}{legend}</>,
    },
    {
      title: 'The idea: a dividing line',
      text: [
        'Passes are mostly top-right (studied and slept a lot), fails are mostly bottom-left. A straight line can split them.',
        'That line is called the **decision boundary**. On one side the model says "pass", on the other side "fail".',
      ],
      visual: () => <>{<Board run={run} f={m} heat={false} />}{legend}</>,
    },
    {
      title: 'Not just yes or no: how sure?',
      text: [
        'A student far from the line is an easy call. A student right next to it is a coin flip.',
        'So the model gives every student a **probability** of passing. The background shows it: strong orange = surely pass, strong blue = surely fail, pale = unsure.',
      ],
      visual: () => <>{<Board run={run} f={m} />}{legend}</>,
    },
    {
      title: 'How a student\'s position becomes a chance',
      text: [
        'For each student the model computes a **score**: z = w₁ × study + w₂ × sleep + b. Positive means it leans "pass", negative means it leans "fail", and 0 means exactly on the line.',
        'The **sigmoid** S-curve then turns the score into a chance between 0% and 100%. Three real students are marked on the curve.',
      ],
      visual: () => (
        <Plot xDomain={[-8, 8]} yDomain={[-0.04, 1.04]} xLabel="score z (negative = leans fail, positive = leans pass)" yLabel="chance of passing" height={400}>
          {(c) => (
            <>
              <polyline fill="none" stroke="var(--accent)" strokeWidth={3.5} points={lin(-8, 8, 90).map((z) => `${c.sx(z)},${c.sy(sigmoid(z))}`).join(' ')} />
              <line x1={c.sx(0)} x2={c.sx(0)} y1={0} y2={c.h} stroke="var(--muted)" strokeDasharray="4 4" />
              {examples.map((i, k) => {
                const z = Math.max(-8, Math.min(8, zOf(i)))
                return (
                  <g key={k}>
                    <circle cx={c.sx(z)} cy={c.sy(sigmoid(z))} r={8} fill={classColor(data.y[i])} stroke="#fff" strokeWidth={3} />
                    <text x={c.sx(z) + (k === 2 ? -12 : 12)} y={c.sy(sigmoid(z)) + (k === 0 ? -14 : k === 2 ? 26 : -14)} textAnchor={k === 2 ? 'end' : 'start'} className="chart-label small-label">
                      {fmt(data.X[i][0], 1)}h study, {fmt(data.X[i][1], 1)}h sleep → z {fmt(zOf(i), 1)} → {pct(sigmoid(zOf(i)))}
                    </text>
                  </g>
                )
              })}
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'Learning starts with no opinion',
      text: [
        'At the start every **weight** is 0, so every student\'s score is 0 and their chance is exactly 50%. That is why the picture is one flat colour with no line.',
        'Now the model has to learn where the line goes.',
      ],
      visual: () => <Board run={run} f={path[0]} label="every student: 50%" />,
    },
    {
      title: 'Watch the line find its place',
      text: [
        'Each step, students on the wrong side nudge the line so that they end up on their own side, and the more wrong they are, the harder they nudge. The line turns and slides into place: this is **gradient descent**.',
        'What it is minimising is the **log loss**, a score that punishes confident mistakes heavily. As it learns, the colours get stronger: the model becomes more sure.',
      ],
      frames: path.length,
      fps: 12,
      visual: (t) => <Board run={run} f={path[t]} label={`step ${path[t].step}: ${pct(path[t].acc)} on the correct side`} />,
    },
    {
      title: 'The result',
      text: [
        `${tr.length - wrong.length} of ${tr.length} training students end up on the correct side (${pct(R.train_metrics.accuracy)}).`,
        `The ${wrong.length} circled in red are on the wrong side. Most sit near the line: borderline students where luck decided. No straight line could get them all.`,
      ],
      visual: () => <Board run={run} f={m} highlight={wrong} label={`${wrong.length} students on the wrong side`} />,
    },
    {
      title: 'Test it on hidden students',
      text: [
        `These hollow dots are the **test set**: students hidden during learning. The model gets **${pct(T.accuracy)}** of them right (**accuracy**).`,
        `**Precision** ${pct(T.precision)}: when it says "pass", it is right that often. **Recall** ${pct(T.recall)}: of the students who really passed, it spotted that many.`,
      ],
      visual: () => <Board run={run} f={m} show="test" label={`hidden students: ${pct(T.accuracy)} correct`} />,
    },
    {
      title: 'The limit: only straight lines',
      text: [
        'Here the two groups curl around each other like two crescent moons. No straight line can separate them.',
        `Logistic regression does its best but gets stuck at ${pct(moons.result.test_metrics.accuracy)}. For shapes like this you need models that can bend, like **decision trees**.`,
      ],
      visual: () => <Board run={moons} f={moons.result.model} label={`best straight line: ${pct(moons.result.test_metrics.accuracy)}`} />,
    },
    {
      title: 'Recap',
      text: [
        'Logistic regression in one sentence: draw a straight line between the two groups, and turn each point\'s distance from it into a chance using the S-curve.',
        'It is simple, fast and explainable, and great whenever a straight line can roughly split the groups.',
      ],
      visual: () => (
        <Recap
          loop={[2, 4]}
          steps={['Collect students with a **label**: pass or fail', 'Start with all **weights** at 0 (everyone 50%)', 'Score each student and squash with the **sigmoid**', 'Measure the **log loss**', 'Nudge the line (**gradient descent**)', 'Test on hidden students (**accuracy**, **precision**, **recall**)']}
        />
      ),
    },
  ]
}
