import { axes, Points } from '../components/DataPoints'
import { classColor, HeatGrid, Plot, probColor } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { TreeView, type Node } from '../viz/ForestViz'
import { ChartLabel, Deck, pct, Recap, testOf, trainOf, useRuns, type SlideDef } from './common'

export function ForestDeck() {
  const { runs, err } = useRuns([{ algo: 'forest', dataset: 'plants', n: 300, params: { n_estimators: 25, max_depth: 4 } }])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="Random Forest" slides={build(runs[0])} />
}

interface Cut { f: number; t: number; lo: number; hi: number; depth: number }

/** Turn a tree into the straight cuts it makes on the chart, in the order the questions are asked (breadth-first). */
function cutsOf(nodes: Node[], box: [number, number, number, number]): Cut[] {
  const out: Cut[] = []
  const queue: { i: number; box: [number, number, number, number]; depth: number }[] = [{ i: 0, box, depth: 0 }]
  while (queue.length) {
    const { i, box: [x0, x1, y0, y1], depth } = queue.shift()!
    const n = nodes[i]
    if (n.l === -1) continue
    if (n.f === 0) {
      out.push({ f: 0, t: n.t, lo: y0, hi: y1, depth })
      queue.push({ i: n.l, box: [x0, n.t, y0, y1], depth: depth + 1 }, { i: n.r, box: [n.t, x1, y0, y1], depth: depth + 1 })
    } else {
      out.push({ f: 1, t: n.t, lo: x0, hi: x1, depth })
      queue.push({ i: n.l, box: [x0, x1, y0, n.t], depth: depth + 1 }, { i: n.r, box: [x0, x1, n.t, y1], depth: depth + 1 })
    }
  }
  return out
}

export function build(run: RunResponse): SlideDef[] {
  const R = run.result
  const a = axes(run)
  const { data } = run
  const te = testOf(run)
  const tr = trainOf(run)
  const trees: { nodes: Node[]; in_bag: number[] }[] = R.trees
  const grid: number[][] = R.tree_grid
  const box: [number, number, number, number] = [a.xDomain[0], a.xDomain[1], a.yDomain[0], a.yDomain[1]]
  const cuts0 = cutsOf(trees[0].nodes, box)
  const root = trees[0].nodes[0]
  const fname = (f: number) => (f === 0 ? 'temperature' : 'humidity')
  const unit = (f: number) => (f === 0 ? ' °C' : '%')
  const legend = <Legend items={[{ color: classColor(0), label: 'wilted' }, { color: classColor(1), label: 'thrived' }]} />
  const avg = (k: number) => grid[0].map((_, c) => grid.slice(0, k).reduce((s, g) => s + g[c], 0) / k)
  const singleAvg = R.single_tree_scores.reduce((s: number, v: number) => s + v, 0) / R.single_tree_scores.length
  // a hidden plant where the trees disagree the most, to show a real vote
  const cellOf = (i: number) => {
    const near = (arr: number[], v: number) => arr.reduce((bi, x, k) => (Math.abs(x - v) < Math.abs(arr[bi] - v) ? k : bi), 0)
    return near(R.grid.ys, a.py[i]) * R.grid.xs.length + near(R.grid.xs, a.px[i])
  }
  const share = (i: number) => grid.reduce((s, g) => s + g[cellOf(i)], 0) / grid.length
  const voter = te.reduce((bi, i) => (Math.abs(share(i) - 0.62) < Math.abs(share(bi) - 0.62) ? i : bi), te[0])
  const yes = Math.round(share(voter) * grid.length)

  const board = (opts: { cuts?: Cut[]; regions?: number[]; label?: string; show?: 'train' | 'test' | 'all'; hl?: number; bag?: number[] }) => (
    <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="temperature (°C)" yLabel="humidity (%)" height={400}>
      {(c) => (
        <>
          {opts.regions && <HeatGrid xs={R.grid.xs} ys={R.grid.ys} values={opts.regions} ctx={c} color={probColor} opacity={0.34} />}
          {opts.bag
            ? tr.map((i, j) => {
              const k = opts.bag![j]
              const col = classColor(data.y[i])
              return <circle key={i} cx={c.sx(a.px[i])} cy={c.sy(a.py[i])} r={k === 0 ? 3.5 : 3.5 + 1.6 * k} fill={k === 0 ? 'none' : col} stroke={k === 0 ? col : '#fff'} strokeWidth={k === 0 ? 1.4 : 1} opacity={k === 0 ? 0.5 : 0.9} />
            })
            : <Points run={run} ctx={c} show={opts.show ?? 'train'} radius={4.5} />}
          {opts.cuts?.map((ct, k) => ct.f === 0
            ? <line key={k} x1={c.sx(ct.t)} x2={c.sx(ct.t)} y1={c.sy(ct.lo)} y2={c.sy(ct.hi)} stroke="var(--ink)" strokeWidth={Math.max(1.5, 4 - ct.depth)} />
            : <line key={k} x1={c.sx(ct.lo)} x2={c.sx(ct.hi)} y1={c.sy(ct.t)} y2={c.sy(ct.t)} stroke="var(--ink)" strokeWidth={Math.max(1.5, 4 - ct.depth)} />)}
          {opts.hl !== undefined && <circle cx={c.sx(a.px[opts.hl])} cy={c.sy(a.py[opts.hl])} r={12} fill="none" stroke="var(--ink)" strokeWidth={3} />}
          {opts.label && <ChartLabel>{opts.label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  return [
    {
      title: 'Will the plant survive?',
      text: [
        'Each dot is a plant from a nursery: its temperature (left to right) and humidity (bottom to top). Orange plants thrived, blue plants wilted.',
        'The thriving plants sit in a box: not too cold, not too hot, and humid enough. A single straight line cannot fence in a box, so we need something smarter.',
      ],
      visual: () => <>{board({})}{legend}</>,
    },
    {
      title: 'Ask a question',
      text: [
        `A gardener would ask questions. The computer tried every possible question and picked the most useful first one: **"Is ${fname(root.f)} ≤ ${fmt(root.t, 0)}${unit(root.f)}?"**`,
        'That question cuts the chart in two. It was chosen because it leaves the two sides as un-mixed as possible (lowest **Gini**: mostly one colour each).',
      ],
      visual: () => board({ cuts: cuts0.slice(0, 1), label: `${fname(root.f)} ≤ ${fmt(root.t, 0)}${unit(root.f)}?` }),
    },
    {
      title: 'Keep asking: a decision tree',
      text: [
        'Inside each side it asks another question, then another. Each new question is a new cut. Watch them appear in order.',
        'The result is a flowchart of questions called a **decision tree**. Each final box is a **leaf** that gives one answer: thrive or wilt.',
      ],
      frames: cuts0.length + 6,
      fps: 2.5,
      visual: (t) => board({ cuts: cuts0.slice(0, Math.min(t + 1, cuts0.length)), regions: t >= cuts0.length ? grid[0] : undefined, label: t >= cuts0.length ? 'final boxes: the tree\'s answers' : `question ${Math.min(t + 1, cuts0.length)} of ${cuts0.length}` }),
    },
    {
      title: 'The same tree as a flowchart',
      text: [
        'Here is that tree written out. Start at the top: if the answer is yes, follow "yes"; otherwise follow "no". You end up at a **leaf** with the answer.',
        'The number after "Gini" shows how mixed the plants at that question are: 0 means they are all the same.',
      ],
      visual: () => (
        <div className="slide-tree">
          <TreeView nodes={trees[0].nodes} names={['temperature', 'humidity']} classes={['WILTS', 'THRIVES']} clf maxDepth={4} />
        </div>
      ),
    },
    {
      title: 'One tree is unreliable',
      text: [
        'Each tree learns from its own random sample of the plants, called a **bootstrap** sample. Big dots were picked more than once; hollow dots were never picked.',
        'Use the animation to flip between 4 trees. Different samples → different questions → different answers. A single tree also chases flukes in its sample (**overfitting**).',
      ],
      frames: Math.min(4, trees.length) * 6,
      fps: 1.5,
      visual: (t) => {
        const k = Math.floor(t / 6)
        return board({ regions: grid[k], bag: trees[k].in_bag, cuts: cutsOf(trees[k].nodes, box), label: `tree ${k + 1}` })
      },
    },
    {
      title: 'A forest of trees votes',
      text: [
        `A random forest trains many trees (${R.n_trees} here), each on its own random sample, and lets them vote. The colour shows the share of trees voting "thrives".`,
        'Watch the blocky single-tree answer smooth into a clean box as trees join. Individual mistakes cancel out in the crowd. That crowd is an **ensemble**.',
      ],
      frames: R.n_trees,
      fps: 4,
      visual: (t) => board({ regions: avg(t + 1), label: `${t + 1} tree${t ? 's' : ''} voting` }),
    },
    {
      title: 'A new plant: the vote',
      text: [
        `The circled plant was hidden during training. ${yes} of the ${grid.length} trees say "thrives" and ${grid.length - yes} say "wilts".`,
        `**Majority vote**: the forest answers **${yes * 2 > grid.length ? 'thrives' : 'wilts'}**, and is about ${pct(Math.max(yes, grid.length - yes) / grid.length)} sure. In reality it ${data.y[voter] ? 'thrived' : 'wilted'}.`,
      ],
      visual: () => board({ regions: avg(grid.length), show: 'all', hl: voter, label: `${yes} of ${grid.length} trees say "thrives"` }),
    },
    {
      title: 'How good is it?',
      text: [
        `On hidden plants (the **test set**) the forest is right **${pct(R.test_metrics.accuracy)}** of the time. A single tree on its own averages ${pct(singleAvg)}.`,
        'The line shows accuracy as more trees join; the grey dots are single trees on their own. The team beats a typical member.',
      ],
      visual: () => (
        <Plot xDomain={[1, R.n_trees]} yDomain={[Math.min(...R.curve, ...R.single_tree_scores) - 0.03, 1]} xLabel="number of trees in the forest" yLabel="accuracy on hidden plants" height={400}>
          {(c) => (
            <>
              {R.single_tree_scores.map((v: number, i: number) => <circle key={i} cx={c.sx(i + 1)} cy={c.sy(v)} r={4} fill="var(--muted)" opacity={0.55} />)}
              <polyline fill="none" stroke="var(--accent)" strokeWidth={3.5} points={R.curve.map((v: number, i: number) => `${c.sx(i + 1)},${c.sy(v)}`).join(' ')} />
              <ChartLabel>forest: {pct(R.test_metrics.accuracy)}   single tree: {pct(singleAvg)}</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'Recap',
      text: [
        'Random forest in one sentence: grow many different decision trees, each on a random sample of the data, and let them vote.',
        'Strong on messy, non-straight patterns, needs little tuning, and tells you which inputs mattered most (**feature importance**).',
      ],
      visual: () => (
        <Recap
          loop={[1, 3]}
          steps={['Collect labelled examples', 'Draw a random **bootstrap** sample', 'Grow a tree: pick questions with the lowest **Gini**', 'Stop at the max depth; **leaves** hold answers', 'All trees **vote** on new examples', 'Test on hidden examples']}
        />
      ),
    },
  ]
}
