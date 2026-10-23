import { Plot } from '../components/Plot'
import { fmt } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, clusterColor, Deck, Dots, equalDomains, GREY, Recap, useRuns, xy, type SlideDef } from './common'

interface Merge { a: number; b: number; dist: number; size: number; xa: number; xb: number; ha: number; hb: number; x: number; new: number }

const STORES = { algo: 'hierarchical', dataset: 'stores', n: 21, params: { n_clusters: 3, linkage: 'average' } }

export function HierarchicalDeck() {
  const { runs, err } = useRuns([STORES])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="Hierarchical Clustering" slides={build(runs[0])} />
}

export function build(run: RunResponse): SlideDef[] {
  const R = run.result
  const { px, py } = xy(run)
  const n = px.length
  const merges: Merge[] = R.merges
  const labelsByK: Record<string, number[]> = R.labels_by_k
  const finalLabels: number[] = R.labels
  const maxH: number = R.max_height
  const K = Number(run.params.n_clusters)
  const dom = equalDomains(px, py, 400)
  const miniDom = equalDomains(px, py, 230, 0.2)

  // members of every node (leaf 0..n-1, merge nodes n..)
  const members: number[][] = Array.from({ length: n }, (_, i) => [i])
  merges.forEach((m) => members.push([...members[m.a], ...members[m.b]]))
  // group membership after t merges: array of root-node ids
  const rootsAfter = (t: number) => {
    const alive = new Set<number>(Array.from({ length: n }, (_, i) => i))
    merges.slice(0, t).forEach((m) => { alive.delete(m.a); alive.delete(m.b); alive.add(m.new) })
    return [...alive]
  }
  const groupOfAfter = (t: number) => {
    const g = new Array(n).fill(-1)
    // colour a group by its lowest store number, so a group keeps its colour while it absorbs others
    rootsAfter(t).forEach((root) => members[root].forEach((i) => { g[i] = members[root].length > 1 ? Math.min(...members[root]) : -1 }))
    return g
  }
  const cutFor = (k: number) => {
    const d = merges.map((m) => m.dist).sort((a, b) => a - b)
    return k > 1 && k < n ? (d[n - k - 1] + d[n - k]) / 2 : maxH * 1.05
  }
  const centre = (node: number) => {
    const m = members[node]
    return [m.reduce((s, i) => s + px[i], 0) / m.length, m.reduce((s, i) => s + py[i], 0) / m.length]
  }

  const Board = ({ colors, label, hl, d = dom, h = 400, r = 6 }: { colors: (i: number) => string; label?: string; hl?: number; d?: typeof dom; h?: number; r?: number }) => (
    <Plot xDomain={d.xDomain} yDomain={d.yDomain} xLabel="east–west position (km)" yLabel="north–south position (km)" height={h}>
      {(c) => (
        <>
          {hl !== undefined && (() => {
            const m = merges[hl]
            const [ax, ay] = centre(m.a)
            const [bx, by] = centre(m.b)
            return <line x1={c.sx(ax)} y1={c.sy(ay)} x2={c.sx(bx)} y2={c.sy(by)} stroke="var(--ink)" strokeWidth={3.5} />
          })()}
          <Dots px={px} py={py} ctx={c} r={r} color={colors} />
          {label && <ChartLabel>{label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  /** the dendrogram, drawn up to `upTo` merges; branches below the cut are coloured by group */
  const Tree = ({ upTo = merges.length, cut, groups, hlLast = false, h = 400 }: { upTo?: number; cut?: number; groups?: number[]; hlLast?: boolean; h?: number }) => {
    const colorOf = (m: Merge) => (groups && (cut === undefined || m.dist <= cut) ? clusterColor(groups[members[m.new][0]]) : 'var(--ink)')
    return (
      <Plot xDomain={[-0.7, n - 0.3]} yDomain={[-maxH * 0.04, maxH * 1.08]} yLabel="distance when merged (km)" xLabel="stores (each dot is one store)" xTicks={false} height={h}>
        {(c) => (
          <>
            {merges.slice(0, upTo).map((m, i) => {
              const col = hlLast && i === upTo - 1 ? 'var(--accent)' : colorOf(m)
              const sw = hlLast && i === upTo - 1 ? 4 : 2.4
              return (
                <g key={i} stroke={col} strokeWidth={sw} fill="none" strokeLinecap="round">
                  <line x1={c.sx(m.xa)} y1={c.sy(m.ha)} x2={c.sx(m.xa)} y2={c.sy(m.dist)} />
                  <line x1={c.sx(m.xb)} y1={c.sy(m.hb)} x2={c.sx(m.xb)} y2={c.sy(m.dist)} />
                  <line x1={c.sx(m.xa)} y1={c.sy(m.dist)} x2={c.sx(m.xb)} y2={c.sy(m.dist)} />
                </g>
              )
            })}
            {R.order.map((leaf: number, pos: number) => (
              <circle key={leaf} cx={c.sx(pos)} cy={c.sy(0)} r={5} fill={groups ? clusterColor(groups[leaf]) : GREY} stroke="#fff" strokeWidth={1.5} />
            ))}
            {cut !== undefined && (
              <>
                <line x1={0} x2={c.w} y1={c.sy(cut)} y2={c.sy(cut)} stroke="var(--bad)" strokeWidth={2.5} strokeDasharray="7 5" />
                <ChartLabel x={12} y={c.sy(cut) - 8}>cut here</ChartLabel>
              </>
            )}
          </>
        )}
      </Plot>
    )
  }

  const m0 = merges[0]
  const cut3 = cutFor(K)

  return [
    {
      title: 'Which stores belong together?',
      text: [
        'A delivery company has 21 stores spread over a city. Each dot is one store on the map. It wants to group nearby stores so that each group can share a depot.',
        'Nobody gives us the groups, so this is **unsupervised learning**. Unlike K-Means we won\'t pick the number of groups first: we will build a whole family tree of groupings and decide later.',
      ],
      visual: () => <Board colors={() => GREY} />,
    },
    {
      title: 'Start: every store is its own group',
      text: [
        '**Hierarchical clustering** begins with 21 groups, each holding a single store.',
        'Then it repeats one simple move: find the two closest groups and merge them. Group by group, the map gets simpler, until only one group is left.',
      ],
      visual: () => <Board colors={(i) => clusterColor(i)} label="21 groups of 1 store each" />,
    },
    {
      title: 'Step 1: merge the two closest stores',
      text: [
        `The closest pair is only ${fmt(m0.dist, 2)} km apart. They merge into one group of two (the line joins them).`,
        'That is 20 groups left. The distance at which a merge happens is remembered: it will become the height in the family tree later.',
      ],
      visual: () => {
        const pair = [m0.a, m0.b]
        return <Board colors={(i) => (pair.includes(i) ? 'var(--accent)' : GREY)} hl={0} label={`closest pair: ${fmt(m0.dist, 2)} km apart`} />
      },
    },
    {
      title: 'Keep merging the closest groups',
      text: [
        'Again and again: find the two closest groups, merge them. Once groups have several stores, we need a rule for the distance between two groups. That rule is the **linkage**. Here it is "average linkage": the average distance over every pair of stores, one from each group.',
        'Watch groups form: single grey dots are still alone, coloured dots belong to a merged group. The black line joins the two groups merging right now.',
      ],
      frames: merges.length + 1,
      fps: 2.6,
      visual: (t) => {
        const g = groupOfAfter(t)
        return <Board colors={(i) => (g[i] < 0 ? GREY : clusterColor(g[i]))} hl={t > 0 ? t - 1 : undefined}
          label={`${n - t} group${n - t === 1 ? '' : 's'} left${t > 0 ? `   merged at ${fmt(merges[t - 1].dist, 2)} km` : ''}`} />
      },
    },
    {
      title: 'The family tree (dendrogram)',
      text: [
        'The **dendrogram** records the whole merging as a tree. Each store is a dot along the bottom. Each time two groups merge, their branches join, at a height equal to the distance when they merged.',
        'Low joins mean close neighbours; high joins mean far-apart groups. Play it to watch the tree grow from the bottom up. The newest merge is purple.',
      ],
      frames: merges.length + 1,
      fps: 3,
      visual: (t) => <Tree upTo={t} hlLast />,
    },
    {
      title: 'Cut the tree to get groups',
      text: [
        `Now the payoff: a horizontal cut across the tree. Everything that was joined below the cut is one group. Here the cut produces **${K} groups**, which are the three neighbourhoods (same colours on the map).`,
        'There is a big empty gap just above the cut: merging those groups would mean joining far-apart neighbourhoods. A long gap like this is a good place to cut.',
      ],
      visual: () => (
        <>
          <Tree cut={cut3} groups={finalLabels} h={230} />
          <Board colors={(i) => clusterColor(finalLabels[i])} d={miniDom} h={230} r={5} />
        </>
      ),
    },
    {
      title: 'Cut higher or lower for more or fewer groups',
      text: [
        'You do not have to decide the number of groups up front. Slide the cut down for many small groups, or up for a few big ones.',
        'Watch the cut rise from 8 groups to 2. Between 3 and 2 groups the cut has to jump across a big gap: that is the sign that 3 is the natural answer.',
      ],
      frames: 7,
      fps: 1.1,
      visual: (t) => {
        const k = 8 - t
        const labels = labelsByK[String(k)]
        return (
          <>
            <Tree cut={cutFor(k)} groups={labels} h={230} />
            <Board colors={(i) => clusterColor(labels[i])} d={miniDom} h={230} r={5} label={`${k} groups`} />
          </>
        )
      },
    },
    {
      title: 'Recap',
      text: [
        'Hierarchical clustering in one sentence: start with every item alone, repeatedly merge the two closest groups, and cut the resulting family tree wherever you like.',
        'It needs no k in advance and shows how groups nest inside each other, but it gets slow on large data and a merge can never be undone.',
      ],
      visual: () => (
        <Recap
          loop={[1, 2]}
          steps={['Start: every item is its own group', 'Find the two closest groups (using a **linkage** rule)', 'Merge them and record the distance', 'Stop when one group is left', 'Draw the **dendrogram** from the merges', 'Cut the tree at a gap to get your **clusters**']}
        />
      ),
    },
  ]
}
