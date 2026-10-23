import { Plot } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, clusterColor, Deck, Dots, GREY, Recap, Star, useRuns, xy, type SlideDef } from './common'

interface Iter { labels: number[]; centroids_before: number[][]; centroids_after: number[][]; inertia: number; shift: number; sizes: number[] }

const GOOD = { algo: 'kmeans', dataset: 'customers', n: 120, params: { k: 4, init: 'random', seed: 7, max_iter: 20 } }
const UNLUCKY = { ...GOOD, params: { k: 4, init: 'random', seed: 8, max_iter: 20 } }

export function KMeansDeck() {
  const { runs, err } = useRuns([GOOD, UNLUCKY])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="K-Means Clustering" slides={build(runs[0], runs[1])} />
}

export function build(run: RunResponse, bad: RunResponse): SlideDef[] {
  const R = run.result
  const { px, py, xDomain, yDomain } = xy(run)
  const n = px.length
  const iters: Iter[] = R.iterations
  const init: number[][] = R.init_centroids
  const last = iters[iters.length - 1]
  const finalC = last.centroids_after
  const k = init.length
  const badR = bad.result
  const badLast: Iter = badR.iterations[badR.iterations.length - 1]
  const meanX = px.reduce((s, v) => s + v, 0) / n
  const meanY = py.reduce((s, v) => s + v, 0) / n
  const profile = (c: number[]) => `${c[0] > meanX ? 'high' : 'low'} income, ${c[1] > meanY ? 'high' : 'low'} spending`
  const nearest = (i: number, cs: number[][]) => cs.reduce((bi, c, j) => (Math.hypot(px[i] - c[0], py[i] - c[1]) < Math.hypot(px[i] - cs[bi][0], py[i] - cs[bi][1]) ? j : bi), 0)

  const Board = ({ labels, centroids, arrows, upTo, lines, label, h = 400 }: {
    labels?: number[]; centroids?: number[][]; arrows?: number[][]; upTo?: number; lines?: boolean; label?: string; h?: number
  }) => (
    <Plot xDomain={xDomain} yDomain={yDomain} xLabel="annual income (thousands per year)" yLabel="spending score (1–100)" height={h}>
      {(c) => (
        <>
          {lines && labels && centroids && px.map((x, i) => (upTo === undefined || i < upTo) && (
            <line key={i} x1={c.sx(x)} y1={c.sy(py[i])} x2={c.sx(centroids[labels[i]][0])} y2={c.sy(centroids[labels[i]][1])} stroke={clusterColor(labels[i])} strokeWidth={1} opacity={0.35} />
          ))}
          <Dots px={px} py={py} ctx={c} r={5}
            color={(i) => (labels && (upTo === undefined || i < upTo) ? clusterColor(labels[i]) : GREY)} />
          {arrows && centroids && arrows.map((a, j) => (
            <line key={'a' + j} x1={c.sx(a[0])} y1={c.sy(a[1])} x2={c.sx(centroids[j][0])} y2={c.sy(centroids[j][1])} stroke="var(--ink)" strokeWidth={2.5} strokeDasharray="5 3" />
          ))}
          {centroids?.map((q, j) => <Star key={j} x={c.sx(q[0])} y={c.sy(q[1])} color={clusterColor(j)} />)}
          {label && <ChartLabel>{label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  // frames for the repeat animation: assign, then move, for every round
  const roundFrames = iters.length * 2

  return [
    {
      title: 'Who are our customers?',
      text: [
        'A shop has 120 customers. Each dot shows one customer\'s yearly income (left to right) and spending score (bottom to top).',
        'Nobody has told us any groups. Finding structure with no answer key is called **unsupervised learning**. Our job: find the natural **clusters** of similar customers so the shop can treat each type differently.',
      ],
      visual: () => <Board />,
    },
    {
      title: 'Close together means similar',
      text: [
        'Customers close to each other on the chart have similar income and spending. Customers far apart are different.',
        'So the computer measures **distance** between points. Groups are customers who are close to each other. Your eye already sees clumps; the computer must find them by distance alone.',
      ],
      visual: () => {
        const a = 0
        const near = px.map((x, i) => ({ i, d: Math.hypot(x - px[a], py[i] - py[a]) })).filter((o) => o.i !== a).sort((u, v) => u.d - v.d)
        const closeI = near[2].i
        const farI = near[near.length - 1].i
        return (
          <Plot xDomain={xDomain} yDomain={yDomain} xLabel="annual income (thousands per year)" yLabel="spending score (1–100)" height={400}>
            {(c) => (
              <>
                <Dots px={px} py={py} ctx={c} r={5} opacity={(i) => (i === a || i === closeI || i === farI ? 1 : 0.35)} />
                <line x1={c.sx(px[a])} y1={c.sy(py[a])} x2={c.sx(px[closeI])} y2={c.sy(py[closeI])} stroke="var(--good)" strokeWidth={3} />
                <line x1={c.sx(px[a])} y1={c.sy(py[a])} x2={c.sx(px[farI])} y2={c.sy(py[farI])} stroke="var(--bad)" strokeWidth={3} strokeDasharray="6 4" />
                <ChartLabel>green: distance {fmt(near[2].d, 0)} (similar)   red: distance {fmt(near[near.length - 1].d, 0)} (different)</ChartLabel>
              </>
            )}
          </Plot>
        )
      },
    },
    {
      title: 'The idea: every group has a centre',
      text: [
        'K-Means describes each group by its centre: the star. A **centroid** is simply the average position of all the customers in the group.',
        'Every customer belongs to whichever centre is closest. Here is the finished answer: 4 centres, each with its own colour. Now let\'s see how the computer finds them from nothing.',
      ],
      visual: () => <Board labels={last.labels} centroids={finalC} label="finished answer: 4 groups" />,
    },
    {
      title: 'Step 1: drop 4 centres at random',
      text: [
        `You tell K-Means how many groups to look for: **k** = ${k}. It then drops ${k} centres on randomly chosen customers. These first guesses are usually poor.`,
        'Nothing is grouped yet: every customer is still grey.',
      ],
      visual: () => (
        <Plot xDomain={xDomain} yDomain={yDomain} xLabel="annual income (thousands per year)" yLabel="spending score (1–100)" height={400}>
          {(c) => (
            <>
              <Dots px={px} py={py} ctx={c} r={5} />
              {init.map((q, j) => <Star key={j} x={c.sx(q[0])} y={c.sy(q[1])} color={clusterColor(j)} />)}
              <ChartLabel>random starting centres</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'Step 2: everyone joins the nearest centre',
      text: [
        'Each customer looks at all the centres and joins the closest one, taking its colour. The thin lines show who joined whom.',
        'The groups are bad for now, because the centres started in the wrong places.',
      ],
      frames: 24,
      fps: 14,
      visual: (t) => <Board labels={px.map((_, i) => nearest(i, iters[0].centroids_before))} centroids={iters[0].centroids_before} lines upTo={Math.ceil(((t + 1) / 24) * n)} label="each customer joins the nearest centre" />,
    },
    {
      title: 'Step 3: move each centre to the middle of its group',
      text: [
        'Now every centre moves to the **centroid** of its group: the average position of its members. The dashed lines show each move.',
        'The centres slide towards where their customers really are.',
      ],
      frames: 14,
      fps: 12,
      visual: (t) => {
        const f = Math.min(1, t / 11)
        const cur = iters[0].centroids_before.map((b, j) => b.map((v, d) => v + (iters[0].centroids_after[j][d] - v) * f))
        return <Board labels={iters[0].labels} centroids={cur} arrows={iters[0].centroids_before} label="centres move to the middle of their group" />
      },
    },
    {
      title: 'Repeat until nothing moves',
      text: [
        'Moved centres mean some customers are now closer to a different centre. So repeat: re-assign everyone, move the centres again.',
        `After ${iters.length} rounds nothing changes any more. That is **convergence**: the algorithm stops. The number on the chart is the **inertia**: how far customers are from their centres in total. It falls round by round.`,
      ],
      frames: roundFrames,
      fps: 2.2,
      visual: (t) => {
        const it = Math.floor(t / 2)
        const moving = t % 2 === 1
        const cs = moving ? iters[it].centroids_after : iters[it].centroids_before
        return <Board labels={iters[it].labels} centroids={cs} arrows={moving ? iters[it].centroids_before : undefined}
          label={`round ${it + 1}: ${moving ? 'move centres' : 'assign customers'}   inertia ${fmt(iters[it].inertia, 0)}`} />
      },
    },
    {
      title: 'What the groups mean',
      text: [
        `K-Means found ${k} customer types: ${finalC.map((c) => `**${profile(c)}** (${last.sizes[finalC.indexOf(c)]} customers)`).join(', ')}.`,
        'The computer did not know these names. It found the groups; we read the meaning. A shop can now send each type a different offer.',
      ],
      visual: () => (
        <Plot xDomain={xDomain} yDomain={yDomain} xLabel="annual income (thousands per year)" yLabel="spending score (1–100)" height={400}>
          {(c) => (
            <>
              <Dots px={px} py={py} ctx={c} r={5} color={(i) => clusterColor(last.labels[i])} />
              {finalC.map((q, j) => (
                <g key={j}>
                  <Star x={c.sx(q[0])} y={c.sy(q[1])} color={clusterColor(j)} size={13} />
                  <text x={c.sx(q[0])} y={c.sy(q[1]) - 20} textAnchor="middle" className="chart-label small-label">{profile(q)}</text>
                </g>
              ))}
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'How many groups should we ask for?',
      text: [
        'We chose 4, but how would we know? Try 1, 2, 3 … groups and look at the **inertia**. It drops steeply until 4 groups, then barely improves. That bend is the **elbow method**.',
        `The second chart agrees: the **silhouette score** (how cleanly separated the groups are) is highest at 4, at ${fmt(R.elbow.silhouette[3], 2)}.`,
      ],
      visual: () => {
        const ks: number[] = R.elbow.k
        const inert: number[] = R.elbow.inertia
        const sil: (number | null)[] = R.elbow.silhouette
        return (
          <>
            <Plot xDomain={[0.7, 8.3]} yDomain={[0, Math.max(...inert) * 1.05]} xLabel="number of groups (k)" yLabel="inertia (smaller = tighter)" height={230}>
              {(c) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={3} points={ks.map((kk, i) => `${c.sx(kk)},${c.sy(inert[i])}`).join(' ')} />
                  {ks.map((kk, i) => <circle key={kk} cx={c.sx(kk)} cy={c.sy(inert[i])} r={kk === 4 ? 9 : 5} fill={kk === 4 ? 'var(--accent)' : 'var(--c0)'} stroke="#fff" strokeWidth={2} />)}
                  <ChartLabel>the bend (elbow) is at 4</ChartLabel>
                </>
              )}
            </Plot>
            <Plot xDomain={[0.7, 8.3]} yDomain={[0, 1]} xLabel="number of groups (k)" yLabel="silhouette (higher = cleaner)" height={230}>
              {(c) => (
                <>
                  <polyline fill="none" stroke="var(--c2)" strokeWidth={3} points={ks.map((kk, i) => (sil[i] === null ? '' : `${c.sx(kk)},${c.sy(sil[i] as number)}`)).filter(Boolean).join(' ')} />
                  {ks.map((kk, i) => sil[i] !== null && <circle key={kk} cx={c.sx(kk)} cy={c.sy(sil[i] as number)} r={kk === 4 ? 9 : 5} fill={kk === 4 ? 'var(--accent)' : 'var(--c2)'} stroke="#fff" strokeWidth={2} />)}
                </>
              )}
            </Plot>
          </>
        )
      },
    },
    {
      title: 'The catch: an unlucky start',
      text: [
        `The random starting centres matter. This run started with three of the four centres inside the same crowd, and got stuck: one real group was split in two while two real groups were merged. Its inertia is ${fmt(badLast.inertia, 0)}, versus ${fmt(last.inertia, 0)} before.`,
        'Fixes: run K-Means several times and keep the best, or use **K-Means++**, which picks starting centres far apart from each other.',
      ],
      visual: () => (
        <>
          <Board labels={badLast.labels} centroids={badLast.centroids_after} label={`unlucky start: inertia ${fmt(badLast.inertia, 0)}`} />
          <Legend items={[{ color: 'var(--ink)', label: 'stars = group centres' }]} />
        </>
      ),
    },
    {
      title: 'Recap',
      text: [
        'K-Means in one sentence: drop k centres, let every point join its nearest centre, move each centre to the middle of its group, and repeat until nothing changes.',
        'It is fast and simple, but you must choose k, it works best on round clumps, and a bad start can fool it.',
      ],
      visual: () => (
        <Recap
          loop={[2, 3]}
          steps={['Choose **k** (use the **elbow method**)', 'Drop k random starting **centroids**', 'Every point joins the nearest centre', 'Move each centre to the average of its group', 'Stop at **convergence** (nothing moves)', 'Read the meaning of each **cluster**']}
        />
      ),
    },
  ]
}

