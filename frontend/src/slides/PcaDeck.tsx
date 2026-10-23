import { classColor, Plot } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, Deck, Dots, equalDomains, Recap, useRuns, type SlideDef } from './common'

const BODY = { algo: 'pca', dataset: 'correlated', n: 120, params: { standardize: 'no', n_components: 1 } }
const IRIS = { algo: 'pca', dataset: 'iris4', n: 150, params: { standardize: 'yes', n_components: 2 } }

export function PcaDeck() {
  const { runs, err } = useRuns([BODY, IRIS])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="PCA" slides={build(runs[0], runs[1])} />
}

const rad = (deg: number) => (deg * Math.PI) / 180

export function build(run: RunResponse, iris: RunResponse): SlideDef[] {
  const R = run.result
  const Z: number[][] = R.centered // height / weight, relative to the average person
  const px = Z.map((p) => p[0])
  const py = Z.map((p) => p[1])
  const n = px.length
  const rot = R.rotation as { angles_deg: number[]; variance: number[]; total: number; best_deg: number }
  const best = rot.best_deg
  const ratio: number[] = R.ratio
  const H = 330
  const dom = equalDomains(px, py, H, 0.12)
  const total = rot.total
  const bestIdx = rot.variance.indexOf(Math.max(...rot.variance))

  const proj = (deg: number) => {
    const u = [Math.cos(rad(deg)), Math.sin(rad(deg))]
    return px.map((x, i) => ({ s: x * u[0] + py[i] * u[1], u }))
  }

  /** points + axis line through the centre at a given angle + projection "shadows" */
  const Scatter = ({ deg, shadows = true, label, showPerp = false }: { deg?: number; shadows?: boolean; label?: string; showPerp?: boolean }) => (
    <Plot xDomain={dom.xDomain} yDomain={dom.yDomain} xLabel="height compared with average (cm)" yLabel="weight compared with average (kg)" height={H}>
      {(c) => {
        const L = Math.max(dom.xDomain[1], dom.yDomain[1]) * 2
        const u = deg === undefined ? null : [Math.cos(rad(deg)), Math.sin(rad(deg))]
        return (
          <>
            {u && shadows && proj(deg as number).map((p, i) => (
              <line key={i} x1={c.sx(px[i])} y1={c.sy(py[i])} x2={c.sx(p.s * u[0])} y2={c.sy(p.s * u[1])} stroke="var(--bad)" strokeWidth={1.2} opacity={0.55} />
            ))}
            {u && <line x1={c.sx(-L * u[0])} y1={c.sy(-L * u[1])} x2={c.sx(L * u[0])} y2={c.sy(L * u[1])} stroke="var(--accent)" strokeWidth={3.5} />}
            {u && showPerp && <line x1={c.sx(L * u[1] * 0.4)} y1={c.sy(-L * u[0] * 0.4)} x2={c.sx(-L * u[1] * 0.4)} y2={c.sy(L * u[0] * 0.4)} stroke="var(--muted)" strokeWidth={2} strokeDasharray="6 4" />}
            <Dots px={px} py={py} ctx={c} r={4.5} color={() => 'var(--c0)'} />
            {u && shadows && proj(deg as number).map((p, i) => <circle key={'s' + i} cx={c.sx(p.s * u[0])} cy={c.sy(p.s * u[1])} r={3} fill="var(--bad)" opacity={0.85} />)}
            {label && <ChartLabel>{label}</ChartLabel>}
          </>
        )
      }}
    </Plot>
  )

  const spreadCurve = (t: number) => (
    <Plot xDomain={[0, 180]} yDomain={[0, Math.max(...rot.variance) * 1.12]} xLabel="angle of the line (degrees)" yLabel="spread along the line" height={210}>
      {(c) => (
        <>
          <polyline fill="none" stroke="var(--c2)" strokeWidth={3} points={rot.angles_deg.slice(0, t + 1).map((a, i) => `${c.sx(a)},${c.sy(rot.variance[i])}`).join(' ')} />
          <circle cx={c.sx(rot.angles_deg[t])} cy={c.sy(rot.variance[t])} r={7} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
          {t >= bestIdx && <line x1={c.sx(rot.angles_deg[bestIdx])} x2={c.sx(rot.angles_deg[bestIdx])} y1={0} y2={c.h} stroke="var(--good)" strokeDasharray="5 4" strokeWidth={2} />}
        </>
      )}
    </Plot>
  )

  const scores: number[][] = R.scores
  const sc1 = scores.map((s) => s[0])
  const iscores: number[][] = iris.result.scores
  const iratio: number[] = iris.result.ratio
  const species = iris.data.y
  const idom = equalDomains(iscores.map((s) => s[0]), iscores.map((s) => s[1]), 400, 0.1)
  const unitsAt = (deg: number) => fmt(rot.variance[Math.round(deg / 3)] ?? 0, 0)

  return [
    {
      title: 'Two numbers for every customer',
      text: [
        'A clothing brand recorded two measurements for each of 120 customers: height and weight. Each dot is one customer, shown relative to the average person (the middle of the chart).',
        'Every customer needs two numbers to describe them, which means **2 dimensions**. Could fewer numbers do the job?',
      ],
      visual: () => <Scatter />,
    },
    {
      title: 'The two numbers move together',
      text: [
        'Taller people tend to weigh more, so the dots form a slanted band rather than a round cloud. That is **correlation**.',
        'Because the two numbers mostly tell the same story ("how big is this person?"), there is a lot of repeated information. Maybe one number, size, could replace both.',
      ],
      visual: () => <Scatter deg={best} shadows={false} label="the dots follow a slanted band" />,
    },
    {
      title: 'Describe each person by one number',
      text: [
        'Here is a way to use one number: draw a line through the middle and drop each dot straight onto it, like a shadow. This is a **projection**. Each person is now described by just one position along the line.',
        'Red dots are the shadows, red lines show the drop. But which line is best? This one (at 135°) is a poor choice: dots with very different sizes land on top of each other.',
      ],
      visual: () => <Scatter deg={135} label="a poor line: shadows pile up" />,
    },
    {
      title: 'Spin the line to find the best one',
      text: [
        'A good line keeps people **spread out** along it. If the shadows are widely spread, we can still tell people apart; if they pile up, we have lost information.',
        'Watch the line turn while the bottom chart tracks the **spread (variance)** of the shadows. The best angle is where the spread peaks.',
      ],
      frames: rot.angles_deg.length,
      fps: 14,
      visual: (t) => (
        <>
          <Scatter deg={rot.angles_deg[t]} label={`angle ${rot.angles_deg[t]}°: spread ${fmt(rot.variance[t], 0)}`} />
          {spreadCurve(t)}
        </>
      ),
    },
    {
      title: 'The winning line: the first principal component',
      text: [
        `The spread peaks at about ${fmt(best, 0)}° (spread ${unitsAt(best)}). That best line is the **principal component**: the direction in which the data varies the most.`,
        'Now the shadows (red) sit very close to the dots, so little is lost. PCA also gives a second line at right angles (dashed), which captures what is left.',
      ],
      visual: () => <Scatter deg={best} showPerp label={`first principal component: ${fmt(best, 0)}°`} />,
    },
    {
      title: 'Two numbers become one',
      text: [
        'Now each customer is described by one number: the position of their shadow along the line. Think of it as a "size score": negative = smaller than average, positive = bigger.',
        'We went from 2 numbers per person to 1. This is **dimensionality reduction**: fewer numbers, as much information as possible kept.',
      ],
      visual: () => (
        <Plot xDomain={[Math.min(...sc1) - 3, Math.max(...sc1) + 3]} yDomain={[-1, 1]} xLabel="size score (position along the line)" height={200}>
          {(c) => (
            <>
              <line x1={0} x2={c.w} y1={c.sy(0)} y2={c.sy(0)} stroke="var(--muted)" />
              {sc1.map((s, i) => <circle key={i} cx={c.sx(s)} cy={c.sy(((i * 37) % 11 - 5) / 12)} r={4.5} fill="var(--c0)" opacity={0.8} />)}
              <ChartLabel>{n} customers, one number each</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'How much did we keep?',
      text: [
        `The first component keeps **${fmt(ratio[0] * 100, 0)}%** of all the spread; the second only ${fmt(ratio[1] * 100, 0)}%. That share is the **explained variance**.`,
        `So one number holds about ${fmt(ratio[0] * 100, 0)}% of the information that two numbers held. If the second component is tiny, dropping it costs little.`,
      ],
      visual: () => (
        <Plot xDomain={[0.4, 2.6]} yDomain={[0, 1]} xTicks={false} yLabel="share of the spread kept" height={330}>
          {(c) => (
            <>
              {ratio.map((v, i) => {
                const x0 = c.sx(i + 0.62)
                const x1 = c.sx(i + 1.38)
                return (
                  <g key={i}>
                    <rect x={x0} y={c.sy(v)} width={x1 - x0} height={c.h - c.sy(v)} rx={6} fill={i === 0 ? 'var(--accent)' : 'var(--c1)'} />
                    <text x={(x0 + x1) / 2} y={c.sy(v) - 8} textAnchor="middle" className="chart-label">{fmt(v * 100, 0)}%</text>
                    <text x={(x0 + x1) / 2} y={c.h - 10} textAnchor="middle" className="chart-label small-label" style={{ fill: '#fff', stroke: 'none' }}>{i === 0 ? 'component 1' : 'component 2'}</text>
                  </g>
                )
              })}
              <ChartLabel>total spread = {fmt(total, 0)}</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'A bigger example: 4 numbers become 2',
      text: [
        'Iris flowers have 4 measurements each (**4 dimensions**), which nobody can draw. PCA squeezes them into 2 numbers we can plot, while keeping ' + `${fmt((iratio[0] + iratio[1]) * 100, 0)}% of the information.`,
        'The colours (3 flower species) were never given to PCA, yet the species separate on the chart. PCA kept the differences that matter.',
      ],
      visual: () => (
        <>
          <Plot xDomain={idom.xDomain} yDomain={idom.yDomain} xLabel={`component 1 (${fmt(iratio[0] * 100, 0)}% of the spread)`} yLabel={`component 2 (${fmt(iratio[1] * 100, 0)}%)`} height={400}>
            {(c) => <Dots px={iscores.map((s) => s[0])} py={iscores.map((s) => s[1])} ctx={c} r={4.5} color={(i) => classColor(species[i])} />}
          </Plot>
          <Legend items={[{ color: classColor(0), label: 'setosa' }, { color: classColor(1), label: 'versicolor' }, { color: classColor(2), label: 'virginica' }]} />
        </>
      ),
    },
    {
      title: 'Recap',
      text: [
        'PCA in one sentence: find the directions in which the data is most spread out, and describe every point by its position along the top few of them.',
        'Use it to draw many-column data, to remove repeated information, or to speed up other models. Its limits: it only uses straight lines, and the new axes are mixes of the old columns, so they are harder to explain.',
      ],
      visual: () => (
        <Recap
          loop={[1, 2]}
          steps={['Start with several measurements per item', 'Try every direction; measure the **spread** along it', 'Keep the direction with the most spread: the **principal component**', 'Repeat at right angles for the next component', 'Describe each item by its **projection** onto the top few', 'Check the **explained variance** to see what was kept']}
        />
      ),
    },
  ]
}

