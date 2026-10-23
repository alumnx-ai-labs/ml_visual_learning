import { Plot } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, clusterColor, Deck, Dots, equalDomains, GREY, Recap, useRuns, xy, type SlideDef } from './common'

interface Ev { p: number; label: number; role: string; n: number }

const BASE = { algo: 'dbscan', dataset: 'pickups', n: 360 }
const MAIN = { ...BASE, params: { eps: 0.5, min_samples: 5 } }
const TINY = { ...BASE, params: { eps: 0.15, min_samples: 5 } }
const HUGE = { ...BASE, params: { eps: 1.6, min_samples: 5 } }
const KM = { algo: 'kmeans', dataset: 'pickups', n: 360, params: { k: 2, init: 'plusplus', seed: 0, max_iter: 20 } }

export function DbscanDeck() {
  const { runs, err } = useRuns([MAIN, KM, TINY, HUGE])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="DBSCAN" slides={build(runs[0], runs[1], runs[2], runs[3])} />
}

export function build(run: RunResponse, km: RunResponse, tiny: RunResponse, huge: RunResponse): SlideDef[] {
  const R = run.result
  const { px, py } = xy(run)
  const n = px.length
  const eps = Number(run.params.eps)
  const minPts = Number(run.params.min_samples)
  const dom = equalDomains(px, py, 400)
  const miniDom = equalDomains(px, py, 190)
  const labels: number[] = R.labels
  const roles: string[] = R.roles
  const counts: number[] = R.neighbor_counts
  const events: Ev[] = R.events
  const kmLabels: number[] = km.result.iterations[km.result.iterations.length - 1].labels
  const dist = (i: number, j: number) => Math.hypot(px[i] - px[j], py[i] - py[j])
  const cores = roles.map((r, i) => (r === 'core' ? i : -1)).filter((i) => i >= 0)
  const noises = roles.map((r, i) => (r === 'noise' ? i : -1)).filter((i) => i >= 0)
  const medianCount = [...cores.map((i) => counts[i])].sort((a, b) => a - b)[Math.floor(cores.length / 2)]
  const dense = cores.reduce((bi, i) => (Math.abs(counts[i] - medianCount) < Math.abs(counts[bi] - medianCount) ? i : bi), cores[0])
  const lonely = noises.reduce((bi, i) => (counts[i] < counts[bi] ? i : bi), noises[0])
  const cluster = (r: RunResponse) => ({ k: r.result.metrics.clusters as number, noise: r.result.metrics.noise as number })

  const Board = ({ colors, hollow, label, d = dom, h = 400, circles, r = 4.5 }: {
    colors?: (i: number) => string; hollow?: (i: number) => boolean; label?: string; d?: typeof dom; h?: number
    circles?: { i: number; color: string }[]; r?: number
  }) => (
    <Plot xDomain={d.xDomain} yDomain={d.yDomain} xLabel="east–west position (km)" yLabel="north–south position (km)" height={h}>
      {(c) => (
        <>
          {circles?.map((o) => (
            <ellipse key={o.i} cx={c.sx(px[o.i])} cy={c.sy(py[o.i])} rx={Math.abs(c.sx(eps) - c.sx(0))} ry={Math.abs(c.sy(eps) - c.sy(0))}
              fill={o.color} fillOpacity={0.12} stroke={o.color} strokeWidth={2.5} />
          ))}
          <Dots px={px} py={py} ctx={c} r={r} color={colors} hollow={hollow} />
          {label && <ChartLabel>{label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  const final = (i: number) => clusterColor(labels[i])
  const stepSize = 6
  const evFrames = Math.ceil(events.length / stepSize) + 3
  const miniBoard = (r: RunResponse, caption: string) => {
    const l: number[] = r.result.labels
    return (
      <Plot xDomain={miniDom.xDomain} yDomain={miniDom.yDomain} height={190}>
        {(c) => (
          <>
            <Dots px={px} py={py} ctx={c} r={3.2} color={(i) => clusterColor(l[i])} />
            <ChartLabel y={20}>{caption}</ChartLabel>
          </>
        )}
      </Plot>
    )
  }

  return [
    {
      title: 'Where are the busy pickup zones?',
      text: [
        'A taxi company logged where passengers were picked up (each dot is one pickup on a city map).',
        'It wants the busy zones so it can station cars there. You can see two curved busy streets, plus some one-off pickups scattered anywhere. No labels, no answer key: this is **unsupervised learning** again.',
      ],
      visual: () => <Board />,
    },
    {
      title: 'Why K-Means cannot do this',
      text: [
        'K-Means (the previous lesson) wants round clumps around a centre. These zones are curved, and K-Means cuts straight through them: each of its two groups holds parts of both streets.',
        'It also forces every stray pickup into some group. We need a method that follows shapes and can say "this one belongs nowhere".',
      ],
      visual: () => <Board colors={(i) => clusterColor(kmLabels[i])} label="K-Means with k = 2: straight cut, wrong groups" />,
    },
    {
      title: 'The idea: busy means crowded',
      text: [
        '**DBSCAN** thinks in terms of **density** (how crowded an area is). A busy zone is just a crowded area; a stray is alone.',
        `For each pickup it draws a circle of radius **ε** (here ${fmt(eps, 1)} km) and counts the points inside (itself included). This pickup (green) has **${counts[dense]}** points in its circle: crowded. This one (red) has only **${counts[lonely]}**${counts[lonely] === 1 ? ', itself' : ''}: alone.`,
      ],
      visual: () => (
        <Board colors={(i) => (dist(i, dense) <= eps ? 'var(--good)' : dist(i, lonely) <= eps ? 'var(--bad)' : GREY)}
          circles={[{ i: dense, color: 'var(--good)' }, { i: lonely, color: 'var(--bad)' }]}
          label={`green circle: ${counts[dense]} points inside   red circle: ${counts[lonely]}`} />
      ),
    },
    {
      title: 'Three kinds of point',
      text: [
        `DBSCAN needs two settings: the radius **ε** = ${fmt(eps, 1)} km and **min points** = ${minPts}. A point with at least ${minPts} points in its circle (itself included) is a **core point**: it is in the thick of a busy area.`,
        'A **border point** has too few neighbours itself but sits next to a core point: the edge of a zone. A **noise point** is neither: a stray that belongs nowhere.',
      ],
      visual: () => (
        <>
          <Board colors={(i) => (roles[i] === 'noise' ? GREY : final(i))} hollow={(i) => roles[i] === 'border'} />
          <Legend items={[{ color: 'var(--c0)', label: `core points (${roles.filter((r) => r === 'core').length})` }, { color: 'var(--c0)', label: `border points (${roles.filter((r) => r === 'border').length})`, ring: true }, { color: GREY, label: `noise points (${roles.filter((r) => r === 'noise').length})` }]} />
        </>
      ),
    },
    {
      title: 'Growing a zone, like spreading news',
      text: [
        'DBSCAN picks a core point and starts a zone there. Every neighbour joins; if a neighbour is itself a core point, its neighbours join too, and so on, spreading outward like a rumour.',
        'When the spreading dies out, that zone is complete. It then starts the next one from an unvisited core point. Watch the two zones grow along the curved streets.',
      ],
      frames: evFrames,
      fps: 16,
      visual: (t) => {
        const upTo = Math.min(events.length, (t + 1) * stepSize)
        const lab = new Array(n).fill(-3) // -3 = not visited yet
        const role = new Array(n).fill('')
        for (let e = 0; e < upTo; e++) { lab[events[e].p] = events[e].label; role[events[e].p] = events[e].role }
        const cur = events[upTo - 1]
        return (
          <Board colors={(i) => (lab[i] === -3 ? '#dfe2ec' : lab[i] === -1 ? GREY : clusterColor(lab[i]))} hollow={(i) => role[i] === 'border'}
            label={cur ? `zone ${cur.label >= 0 ? cur.label + 1 : '–'} growing: ${upTo} of ${events.length} points visited` : ''} />
        )
      },
    },
    {
      title: 'The result',
      text: [
        `DBSCAN found **${cluster(run).k} zones** along the curved streets, and flagged **${cluster(run).noise} pickups as noise**. We never told it how many zones to look for.`,
        'Compare with K-Means: curved shapes are followed, and strays are left out instead of being forced into a group.',
      ],
      visual: () => (
        <>
          <Board colors={(i) => (roles[i] === 'noise' ? GREY : final(i))} hollow={(i) => roles[i] === 'border'} label={`${cluster(run).k} zones, ${cluster(run).noise} strays`} />
          <Legend items={[{ color: 'var(--c0)', label: 'zone 1' }, { color: 'var(--c1)', label: 'zone 2' }, { color: GREY, label: 'noise (strays)' }]} />
        </>
      ),
    },
    {
      title: 'Choosing ε matters',
      text: [
        `**Too small** (ε = 0.15 km): almost nobody has enough neighbours, so nearly everything is noise or tiny scraps (${cluster(tiny).k} clusters, ${cluster(tiny).noise} noise).`,
        `**Too big** (ε = 1.6 km): circles overlap everywhere and the two zones, plus strays, merge into ${cluster(huge).k} blob. **Just right** (0.5 km) gives the two zones.`,
      ],
      visual: () => (
        <>
          {miniBoard(tiny, `ε = 0.15: too small, ${cluster(tiny).k} clusters, ${cluster(tiny).noise} noise`)}
          {miniBoard(run, `ε = 0.5: just right, ${cluster(run).k} zones`)}
          {miniBoard(huge, `ε = 1.6: too big, ${cluster(huge).k} blob`)}
        </>
      ),
    },
    {
      title: 'Recap',
      text: [
        'DBSCAN in one sentence: find crowded areas, grow each into a zone by chaining nearby crowded points, and call lonely points noise.',
        'It follows any shape, needs no k and finds outliers, but you must pick ε and min points, and it struggles when densities vary a lot.',
      ],
      visual: () => (
        <Recap
          loop={[2, 3]}
          steps={['Choose **ε** and **min points**', 'Pick an unvisited point and count its neighbours', 'If it is a **core point**, start a zone and spread to neighbours', 'Spread through every connected core point; **border points** join the edge', 'Points reached by no zone are **noise**', 'Repeat until every point is visited']}
        />
      ),
    },
  ]
}
