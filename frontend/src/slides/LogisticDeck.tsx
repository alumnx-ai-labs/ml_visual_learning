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

/** The one-nudge worked example: two students, all weights 0, learning rate 0.1. Every number is computed here, not typed in. */
function nudgeExample() {
  const st = [
    { name: 'A', study: 8, sleep: 7, y: 1 },
    { name: 'B', study: 2, sleep: 4, y: 0 },
  ]
  const lr = 0.1
  const mean = (v: number[]) => v.reduce((a, c) => a + c, 0) / v.length
  const p0 = st.map(() => sigmoid(0))
  const err0 = st.map((s, i) => p0[i] - s.y)
  const g1 = mean(st.map((s, i) => err0[i] * s.study))
  const g2 = mean(st.map((s, i) => err0[i] * s.sleep))
  const gb = mean(err0)
  const w1 = 0 - lr * g1
  const w2 = 0 - lr * g2
  const b = 0 - lr * gb
  const z1 = st.map((s) => w1 * s.study + w2 * s.sleep + b)
  const p1 = z1.map(sigmoid)
  const err1 = st.map((s, i) => p1[i] - s.y)
  const b2 = b - lr * mean(err1)
  return { st, lr, p0, err0, g1, g2, gb, w1, w2, b, z1, p1, err1, b2 }
}

/** stage 0: start, 1: errors, 2: new weights, 3: after the nudge */
function NudgeTable({ stage }: { stage: number }) {
  const e = nudgeExample()
  const [A, B] = e.st
  return (
    <div className="nudge">
      <table className="ex" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>student</th><th>study</th><th>sleep</th><th>real result</th><th>chance of pass now</th>
            {stage >= 1 && <th>error = chance − real</th>}
            {stage >= 3 && <th>chance after the nudge</th>}
          </tr>
        </thead>
        <tbody>
          {e.st.map((s, i) => (
            <tr key={s.name}>
              <td><b>{s.name}</b></td><td>{s.study} h</td><td>{s.sleep} h</td><td>{s.y ? 'passed (1)' : 'failed (0)'}</td><td>{pct(e.p0[i])}</td>
              {stage >= 1 && <td>{fmt(e.err0[i], 2)}</td>}
              {stage >= 3 && <td><b>{pct(e.p1[i])}</b></td>}
            </tr>
          ))}
        </tbody>
      </table>
      {stage === 0 && <div className="nudge-box">All weights are 0, so both students start at 50%. Next: how wrong is each one?</div>}
      {stage >= 1 && stage < 2 && <div className="nudge-box">A really passed but got only 50%, so the error is negative. B really failed but got 50%, so the error is positive.</div>}
      {stage >= 2 && (
        <div className="nudge-box">
          <div><b>w₁:</b> average of (error × study) = ({fmt(e.err0[0], 2)} × {A.study} + {fmt(e.err0[1], 2)} × {B.study}) ÷ 2 = {fmt(e.g1, 2)} → new w₁ = 0 − {e.lr} × ({fmt(e.g1, 2)}) = <b>{fmt(e.w1, 3)}</b></div>
          <div><b>w₂:</b> average of (error × sleep) = ({fmt(e.err0[0], 2)} × {A.sleep} + {fmt(e.err0[1], 2)} × {B.sleep}) ÷ 2 = {fmt(e.g2, 2)} → new w₂ = <b>{fmt(e.w2, 3)}</b></div>
          <div><b>b:</b> average error = {fmt(e.gb, 2)} → b stays <b>{fmt(e.b, 2)}</b> for now</div>
        </div>
      )}
      {stage >= 3 && (
        <div className="nudge-box">
          A now scores {fmt(e.z1[0], 2)} → {pct(e.p1[0])}. B scores {fmt(e.z1[1], 2)} → {pct(e.p1[1])}: still leaning pass, which is wrong.
          So next round B's error ({fmt(e.err1[1], 2)}) is much bigger than A's ({fmt(e.err1[0], 2)}). B tugs harder and b starts to go negative ({fmt(e.b2, 3)}),
          which slides the line up until B ends on the fail side.
        </div>
      )}
    </div>
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
  const cx = tr.reduce((s, i) => s + data.X[i][0], 0) / tr.length // centre of the students, so the tilt demo pivots around the data
  const cy = tr.reduce((s, i) => s + data.X[i][1], 0) / tr.length

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
        'Careful: this is the **finished** line, shown first so you know where we are heading. The model does not start here. It starts with no line at all, and later slides show how it finds this one.',
      ],
      visual: () => <>{<Board run={run} f={m} heat={false} label="the finished line (we learn it later)" />}{legend}</>,
    },
    {
      title: 'Why straight, and how it is drawn',
      text: [
        '**Why straight?** The model scores every student with a weighted sum: z = w₁ × study + w₂ × sleep + b. It says "pass" when z is above 0 and "fail" below, so the dividing line is wherever z = 0. A weighted sum set to 0 always draws a straight line.',
        '**How is it drawn?** Three numbers do all the work. The two **weights** w₁ and w₂ set the tilt of the line, and b slides it up or down. Watch each one in turn. Example: z = 1 × study + 1 × sleep − 10. A student with 7 hours of study and 5 of sleep scores +2 (88% pass); one with 4 and 4 scores −2 (12% pass).',
        'So "find the best line" simply means "find the best three numbers". That is what learning does.',
      ],
      frames: 36,
      fps: 10,
      visual: (t) => {
        let f: { w1: number; w2: number; b: number }
        let label: string
        if (t < 18) {
          const w2 = 0.2 + (3.8 * t) / 17
          f = { w1: 1, w2, b: -(cx + w2 * cy) }
          label = `w₁ = 1, w₂ = ${fmt(w2, 1)}: the tilt changes`
        } else {
          const b = -14 + (8 * (t - 18)) / 17
          f = { w1: 1, w2: 1, b }
          label = `w₁ = 1, w₂ = 1, b = ${fmt(b, 1)}: the line slides`
        }
        return <>{<Board run={run} f={f} heat={false} label={label} />}{legend}</>
      },
    },
    {
      title: 'Not just yes or no: how sure?',
      text: [
        'A student far from the line is an easy call. A student right next to it is a coin flip.',
        'So the model gives every student a **probability** of passing. The background shows it: strong orange = surely pass, strong blue = surely fail, pale = unsure. (Still the finished model.)',
      ],
      visual: () => <>{<Board run={run} f={m} label="the finished model" />}{legend}</>,
    },
    {
      title: 'How a student\'s position becomes a chance',
      text: [
        'For each student the model computes a **score**: z = w₁ × study + w₂ × sleep + b. Positive means it leans "pass", negative means it leans "fail", and 0 means exactly on the line.',
        'The **sigmoid** S-curve then turns the score into a chance between 0% and 100%. Three real students are marked on the curve, scored with the finished weights (the w₁, w₂ and b the model ends up with).',
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
        'Starting at zero is fine here: the error has a single bowl-shaped valley, so wherever the weights start, the nudging rolls down to the same best line. (Neural networks are different: they start from small random numbers.)',
        'This is the real starting point. The earlier slides showed the finished result; next you see how the model gets from here to there.',
      ],
      visual: () => <Board run={run} f={path[0]} label="every student: 50%" />,
    },
    {
      title: 'One nudge, worked by hand',
      text: [
        'Two students, all weights at 0, so both start at 50%. A studied 8 hours, slept 7, and passed. B studied 2 hours, slept 4, and failed.',
        'Each student tugs on the weights by (chance − real result) × their own hours. A is under-rated (error −0.5), B is over-rated (+0.5). Average the tugs, take a small step (the **learning rate**, 0.1 here), and A jumps to 85% while B drops to 65%. (Simplified: the real model rescales the hours first.)',
        'Do this for every student, hundreds of times: that is **gradient descent**. Students who are wrong or unsure tug hard; students already right and confident barely tug.',
      ],
      frames: 4,
      fps: 0.7,
      visual: (t) => <NudgeTable stage={t} />,
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
