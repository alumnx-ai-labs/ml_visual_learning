import { axes, Points } from '../components/DataPoints'
import { extent, Plot } from '../components/Plot'
import { fmt } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, Deck, Recap, testOf, trainOf, useRuns, type SlideDef } from './common'

interface Frame { step: number; w: number; b: number; loss: number }

export function LinearDeck() {
  const { runs, err } = useRuns([{ algo: 'linear', dataset: 'study', n: 80 }])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="Linear Regression" slides={build(runs[0])} />
}

export function build(run: RunResponse): SlideDef[] {
  const R = run.result
  const a = axes(run)
  const tr = trainOf(run)
  const te = testOf(run)
  const path: Frame[] = R.gd.path
  const { w, b } = R.model
  const pick = tr.reduce((best, i) => (Math.abs(a.px[i] - 6) < Math.abs(a.px[best] - 6) ? i : best), tr[0])
  const at7 = w * 7 + b
  const yWide = extent([0, ...a.py], 0.04) // includes the zero line for the "start from nothing" slides
  const mid = path[Math.min(path.length - 1, Math.round(path.length * 0.08))]

  const frame = (yDomain: [number, number], fw: number, fb: number, opts: { resid?: boolean; label?: string; test?: boolean } = {}) => (
    <Plot xDomain={a.xDomain} yDomain={yDomain} xLabel="hours studied" yLabel="exam score" height={400}>
      {(c) => (
        <>
          {opts.resid && (opts.test ? te : tr).map((i) => (
            <line key={i} x1={c.sx(a.px[i])} x2={c.sx(a.px[i])} y1={c.sy(a.py[i])} y2={c.sy(fw * a.px[i] + fb)} stroke="var(--bad)" strokeWidth={1.4} strokeDasharray="3 2" opacity={0.75} />
          ))}
          <line x1={c.sx(a.xDomain[0])} x2={c.sx(a.xDomain[1])} y1={c.sy(fw * a.xDomain[0] + fb)} y2={c.sy(fw * a.xDomain[1] + fb)} stroke="var(--accent)" strokeWidth={3.5} />
          <Points run={run} ctx={c} show={opts.test ? 'test' : 'train'} radius={5} />
          {opts.label && <ChartLabel>{opts.label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  return [
    {
      title: 'Can we predict an exam score?',
      text: [
        'Each dot is one student from last year: how many hours they studied (left to right) and the score they got (bottom to top).',
        'A new student says: "I will study 7 hours." What score should we expect? That is what **linear regression** answers: it predicts a number.',
      ],
      visual: () => (
        <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="hours studied" yLabel="exam score" height={400}>
          {(c) => <Points run={run} ctx={c} show="train" radius={5} />}
        </Plot>
      ),
    },
    {
      title: 'Look at one student',
      text: [
        `The highlighted student studied **${fmt(a.px[pick], 1)} hours** and scored **${fmt(a.py[pick], 0)}**.`,
        'What we know (hours) is called the **feature**. What we want to predict (score) is called the **target**. Every dot is one example of both.',
      ],
      visual: () => (
        <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="hours studied" yLabel="exam score" height={400}>
          {(c) => (
            <>
              <Points run={run} ctx={c} show="train" radius={5} />
              <line x1={c.sx(a.px[pick])} x2={c.sx(a.px[pick])} y1={c.sy(a.py[pick])} y2={c.h} stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={2} />
              <line x1={0} x2={c.sx(a.px[pick])} y1={c.sy(a.py[pick])} y2={c.sy(a.py[pick])} stroke="var(--accent)" strokeDasharray="4 3" strokeWidth={2} />
              <circle cx={c.sx(a.px[pick])} cy={c.sy(a.py[pick])} r={10} fill="var(--accent)" stroke="#fff" strokeWidth={3} />
              <ChartLabel x={c.sx(a.px[pick]) + 16} y={c.sy(a.py[pick]) - 12}>{fmt(a.px[pick], 1)} h → {fmt(a.py[pick], 0)} pts</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'The idea: draw a straight line',
      text: [
        'The dots roughly go up in a straight line: more study, higher score. So let\'s draw a line through the middle of them.',
        'A line is a simple rule: **score = slope × hours + intercept**. The **slope** says how many points each extra hour adds. The **intercept** is where the line starts at 0 hours.',
      ],
      frames: 30,
      visual: (t) => {
        const x1 = a.xDomain[0] + ((a.xDomain[1] - a.xDomain[0]) * t) / 29
        return (
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="hours studied" yLabel="exam score" height={400}>
            {(c) => (
              <>
                <Points run={run} ctx={c} show="train" radius={5} />
                <line x1={c.sx(a.xDomain[0])} x2={c.sx(x1)} y1={c.sy(w * a.xDomain[0] + b)} y2={c.sy(w * x1 + b)} stroke="var(--accent)" strokeWidth={3.5} />
              </>
            )}
          </Plot>
        )
      },
    },
    {
      title: 'Using the line to predict',
      text: [
        `To predict, go up from 7 hours to the line, then across to the score: about **${fmt(at7, 0)} points**.`,
        'That is the whole point of a **model**: a rule we can use for students we have never seen. But how does the computer find the right line? Let\'s watch it learn from scratch.',
      ],
      visual: () => (
        <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="hours studied" yLabel="exam score" height={400}>
          {(c) => (
            <>
              <Points run={run} ctx={c} show="train" radius={4} />
              <line x1={c.sx(a.xDomain[0])} x2={c.sx(a.xDomain[1])} y1={c.sy(w * a.xDomain[0] + b)} y2={c.sy(w * a.xDomain[1] + b)} stroke="var(--accent)" strokeWidth={3.5} />
              <line x1={c.sx(7)} x2={c.sx(7)} y1={c.h} y2={c.sy(at7)} stroke="var(--good)" strokeWidth={2.5} strokeDasharray="5 4" />
              <line x1={0} x2={c.sx(7)} y1={c.sy(at7)} y2={c.sy(at7)} stroke="var(--good)" strokeWidth={2.5} strokeDasharray="5 4" />
              <circle cx={c.sx(7)} cy={c.sy(at7)} r={8} fill="var(--good)" stroke="#fff" strokeWidth={3} />
              <ChartLabel x={c.sx(7) + 14} y={c.sy(at7) + 26}>7 hours → about {fmt(at7, 0)}</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'Step 1 of learning: start with a bad guess',
      text: [
        'The computer begins knowing nothing. Its first line is flat at zero: it predicts a score of 0 for every student.',
        'The red lines show how wrong it is for each student. Each one is a **residual**: the real score minus the predicted score.',
      ],
      visual: () => frame(yWide, 0, 0, { resid: true, label: 'Guess: score = 0 × hours + 0' }),
    },
    {
      title: 'Step 2: measure how wrong it is',
      text: [
        `Square every red line and take the average. That gives one number for "how wrong is this line": the **MSE**. Right now it is **${fmt(path[0].loss, 0)}**, which is huge.`,
        'Squaring stops + and − mistakes from cancelling out, and makes big mistakes count extra. The goal of learning: make this number as small as possible.',
      ],
      visual: () => frame(yWide, 0, 0, { resid: true, label: `MSE = ${fmt(path[0].loss, 0)}` }),
    },
    {
      title: 'Step 3: nudge the line, again and again',
      text: [
        'Each step, the computer works out which way to tilt and move the line to make the MSE smaller (that direction is the **gradient**), then moves it a little. How big each move is: the **learning rate**.',
        'Repeating this hundreds of times is called **gradient descent**. Watch the line climb into place and the red lines shrink.',
      ],
      frames: path.length,
      fps: 14,
      visual: (t) => frame(yWide, path[t].w, path[t].b, { resid: true, label: `step ${path[t].step}   MSE = ${fmt(path[t].loss, 1)}` }),
    },
    {
      title: 'The mistake shrinking',
      text: [
        `The MSE falls from ${fmt(path[0].loss, 0)} to ${fmt(path[path.length - 1].loss, 1)}. Big improvements come first (after ${mid.step} steps it is already ${fmt(mid.loss, 0)}), then only tiny adjustments.`,
        'When the curve goes flat, the line has stopped improving: **training** is done.',
      ],
      frames: path.length,
      fps: 14,
      visual: (t) => (
        <Plot xDomain={[0, path[path.length - 1].step]} yDomain={[0, path[0].loss * 1.05]} xLabel="number of steps" yLabel="MSE (how wrong)" height={400}>
          {(c) => (
            <>
              <polyline fill="none" stroke="var(--c0)" strokeWidth={3} points={path.slice(0, t + 1).map((q) => `${c.sx(q.step)},${c.sy(q.loss)}`).join(' ')} />
              <circle cx={c.sx(path[t].step)} cy={c.sy(path[t].loss)} r={7} fill="var(--accent)" />
              <ChartLabel>MSE = {fmt(path[t].loss, 1)}</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'The learned rule',
      text: [
        `The final line is **score = ${fmt(w, 2)} × hours + ${fmt(b, 1)}**.`,
        `In plain words: every extra hour of study adds about ${fmt(w, 1)} points, and someone who studies 0 hours would get about ${fmt(b, 0)}. The two numbers ${fmt(w, 2)} and ${fmt(b, 1)} are the model's **parameters**: the only things it learned.`,
      ],
      visual: () => frame(a.yDomain, w, b, { label: `score = ${fmt(w, 2)} × hours + ${fmt(b, 1)}` }),
    },
    {
      title: 'Is it any good? Test it on hidden students',
      text: [
        `Before training, we hid ${te.length} students. That is the **test set**: the line never saw them. These hollow dots are those students.`,
        `On them its typical mistake is about **${fmt(R.test_metrics.rmse, 1)} points** (the **RMSE**). Its **R²** is ${fmt(R.test_metrics.r2, 2)}, meaning it explains about ${Math.round(R.test_metrics.r2 * 100)}% of why students' scores differ. Pretty good for one straight line.`,
      ],
      visual: () => frame(a.yDomain, w, b, { resid: true, test: true, label: `hidden students: R² = ${fmt(R.test_metrics.r2, 2)}` }),
    },
    {
      title: 'Recap',
      text: [
        'Linear regression in one sentence: find the straight line with the smallest average squared mistake by nudging it downhill, step by step.',
        'Its limit: it can only draw straight lines. For curved patterns you need models like **Random Forest** or **XGBoost**. They come next.',
      ],
      visual: () => (
        <Recap
          loop={[2, 4]}
          steps={['Collect examples: hours and score', 'Start with a flat line', 'Predict every student and measure the **MSE**', 'Find the downhill direction (**gradient**)', 'Move the line a little (**learning rate**)', 'Test on hidden students (**R²**)']}
        />
      ),
    },
  ]
}
