import { useState } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { HeatGrid, Plot, probColor, classColor } from '../components/Plot'
import { Callout, Card, fmt, Legend, Slider } from '../components/ui'
import type { VizProps } from '../types'

interface Node { f: number; t: number; l: number; r: number; n: number; imp: number; v: number | number[] }

/** Compact text view of a decision tree: each line is one question, indentation = depth. */
function TreeView({ nodes, names, classes, clf, maxDepth = 3 }: { nodes: Node[]; names: string[]; classes: string[]; clf: boolean; maxDepth?: number }) {
  const rows: { depth: number; text: string; leaf: boolean; color?: string }[] = []
  const walk = (i: number, depth: number, prefix: string) => {
    const nd = nodes[i]
    const leaf = nd.l === -1
    let text = prefix
    let color: string | undefined
    if (leaf || depth >= maxDepth) {
      if (clf) {
        const v = nd.v as number[]
        const k = v[1] > v[0] ? 1 : 0
        text += `→ ${classes[k]} (${Math.round(v[k] * 100)}% of ${nd.n} pts)`
        color = classColor(k)
      } else {
        text += `→ predict ${fmt(nd.v as number, 1)} (mean of ${nd.n} pts)`
      }
      rows.push({ depth, text: text + (!leaf ? '  …more splits' : ''), leaf: true, color })
      return
    }
    rows.push({ depth, text: `${prefix}ask: is ${names[nd.f]} ≤ ${fmt(nd.t, 2)}?  (${nd.n} pts, impurity ${fmt(nd.imp, 2)})`, leaf: false })
    walk(nd.l, depth + 1, 'yes ')
    walk(nd.r, depth + 1, 'no ')
  }
  walk(0, 0, '')
  return (
    <div style={{ fontSize: '.82rem', fontFamily: 'ui-monospace, Consolas, monospace', overflowX: 'auto', lineHeight: 1.75 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ paddingLeft: r.depth * 18, whiteSpace: 'nowrap', color: r.leaf ? r.color ?? 'var(--ink)' : 'var(--ink)', fontWeight: r.leaf ? 700 : 400 }}>{r.text}</div>
      ))}
    </div>
  )
}

export function ForestViz({ run }: VizProps) {
  const R = run.result
  const clf = run.task === 'classification'
  const a = axes(run)
  const { data } = run
  const [tree, setTree] = useState(0)
  const [kTrees, setK] = useState(Math.min(R.n_trees, 5))
  const [click, setClick] = useState<{ x: number; y: number } | null>(null)
  const t = Math.min(tree, R.shown_trees - 1)
  const trainIdx = data.is_test.flatMap((x, i) => (x ? [] : [i]))
  const inBag: number[] = R.trees[t].in_bag
  const nx = R.grid.xs.length
  const cell = (cx: number, cy: number | null) => {
    const near = (arr: number[], v: number) => arr.reduce((bi, x, i) => (Math.abs(x - v) < Math.abs(arr[bi] - v) ? i : bi), 0)
    return cy === null ? near(R.grid.xs, cx) : near(R.grid.ys, cy) * nx + near(R.grid.xs, cx)
  }

  const treeGrid: number[][] = R.tree_grid
  const meanGrid = (k: number) => treeGrid[0].map((_, c) => treeGrid.slice(0, k).reduce((s, g) => s + g[c], 0) / k)
  const forest = meanGrid(kTrees)

  const clicked = click ? (clf ? cell(click.x, click.y) : cell(click.x, null)) : null
  const votes = clicked !== null ? treeGrid.slice(0, kTrees).map((g) => g[clicked]) : []

  const sizeOf = (i: number) => { const ti = trainIdx.indexOf(i); return ti >= 0 ? inBag[ti] : 0 }

  const treeChart = (ctxProps: { regression: boolean }) => (
    <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={340}>
      {(ctx) => (
        <>
          {!ctxProps.regression && <HeatGrid xs={R.grid.xs} ys={R.grid.ys} values={treeGrid[t].map((v) => v)} ctx={ctx} color={(v) => (v > 0.5 ? classColor(1) : classColor(0))} opacity={0.28} />}
          {ctxProps.regression && (
            <polyline fill="none" stroke="var(--accent)" strokeWidth={2.8}
              points={R.grid.xs.map((x: number, i: number) => `${ctx.sx(x)},${ctx.sy(treeGrid[t][i])}`).join(' ')} />
          )}
          {trainIdx.map((i) => {
            const c = sizeOf(i)
            return (
              <circle key={i} cx={ctx.sx(a.px[i])} cy={ctx.sy(a.py[i])} r={c === 0 ? 3.2 : 3.2 + c * 1.5}
                fill={c === 0 ? 'none' : clf ? classColor(data.y[i]) : 'var(--c0)'}
                stroke={c === 0 ? (clf ? classColor(data.y[i]) : 'var(--c0)') : 'var(--panel)'} strokeWidth={c === 0 ? 1.4 : 1} opacity={c === 0 ? 0.55 : 0.9} />
            )
          })}
        </>
      )}
    </Plot>
  )

  return (
    <div className="stack">
      <Card title={`1 · One tree, built from a random sample (tree ${t + 1} of ${R.n_trees})`}>
        <div className="chip-row">
          {Array.from({ length: R.shown_trees }, (_, i) => (
            <button key={i} className={'chip-btn' + (i === t ? ' on' : '')} onClick={() => setTree(i)}>Tree {i + 1}</button>
          ))}
          {R.n_trees > R.shown_trees && <span className="small muted" style={{ alignSelf: 'center' }}>(showing the first {R.shown_trees})</span>}
        </div>
        <div className="grid2">
          <div>
            {treeChart({ regression: !clf })}
            <p className="small muted" style={{ margin: '.3rem 0 0' }}>
              <b>Bigger dot</b> = drawn several times into this tree's bootstrap sample. <b>Hollow dot</b> = left out ("out-of-bag"): this tree never saw it.{' '}
              {clf ? 'Shaded regions are what this single tree predicts.' : 'The purple line is this single tree\'s prediction — note the blocky steps.'}
            </p>
            <Callout>This tree saw {inBag.filter((c) => c > 0).length} distinct points out of {inBag.length} ({inBag.filter((c) => c === 0).length} left out).</Callout>
          </div>
          <div>
            <h4>The questions this tree asks</h4>
            <TreeView nodes={R.trees[t].nodes} names={data.feature_names} classes={[className(run, 0), className(run, 1)]} clf={clf} />
            <p className="small muted">Each question splits the data into two groups that are more alike. Following the answers from the top leads to a leaf with the prediction.</p>
          </div>
        </div>
      </Card>

      <Card title="2 · The whole forest votes">
        <Slider label="Number of trees combined" value={kTrees} min={1} max={R.n_trees} step={1} onChange={setK}
          help="Drag from 1 upward. Watch the jagged single tree turn into a smooth, stable prediction." />
        <div className="grid2">
          <div>
            <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={340}
              onPlotClick={(x, y) => setClick({ x, y })}>
              {(ctx) => (
                <>
                  {clf && <HeatGrid xs={R.grid.xs} ys={R.grid.ys} values={forest} ctx={ctx} color={probColor} />}
                  {!clf && treeGrid.slice(0, kTrees).map((g, ti) => (
                    <polyline key={ti} fill="none" stroke="var(--muted)" strokeWidth={1} opacity={0.35}
                      points={R.grid.xs.map((x: number, i: number) => `${ctx.sx(x)},${ctx.sy(g[i])}`).join(' ')} />
                  ))}
                  {!clf && <polyline fill="none" stroke="var(--accent)" strokeWidth={3.2}
                    points={R.grid.xs.map((x: number, i: number) => `${ctx.sx(x)},${ctx.sy(forest[i])}`).join(' ')} />}
                  <Points run={run} ctx={ctx} />
                  {click && <circle cx={ctx.sx(click.x)} cy={ctx.sy(clf ? click.y : forest[cell(click.x, null)])} r={7} fill="none" stroke="var(--ink)" strokeWidth={2.5} />}
                </>
              )}
            </Plot>
            <Legend items={clf ? pointLegend(run) : [{ color: 'var(--accent)', label: 'forest average' }, { color: 'var(--muted)', label: 'individual trees' }]} />
          </div>
          <div>
            <h4>Test performance as trees are added</h4>
            <Plot xDomain={[1, Math.max(2, R.n_trees)]} yDomain={[Math.min(...R.curve, ...R.single_tree_scores) * 0.97, Math.max(...R.curve, ...R.single_tree_scores) * 1.03]}
              xLabel="number of trees" yLabel={clf ? 'test accuracy' : 'test RMSE (lower = better)'} height={240}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4} points={R.curve.map((v: number, i: number) => `${ctx.sx(i + 1)},${ctx.sy(v)}`).join(' ')} />
                  {R.single_tree_scores.map((v: number, i: number) => <circle key={i} cx={ctx.sx(i + 1)} cy={ctx.sy(v)} r={2.6} fill="var(--muted)" opacity={0.6} />)}
                  <circle cx={ctx.sx(kTrees)} cy={ctx.sy(R.curve[kTrees - 1])} r={6} fill="var(--accent)" />
                </>
              )}
            </Plot>
            <p className="small muted">Line = whole forest of the first k trees. Grey dots = each tree alone. The crowd beats most individuals.</p>
            <Callout>
              {click === null && <><b>Click anywhere on the chart</b> to see how the {kTrees} tree{kTrees > 1 ? 's' : ''} vote at that spot.</>}
              {click !== null && clf && <>At that spot: <b>{votes.filter((v) => v === 1).length}</b> tree(s) say <b>{className(run, 1)}</b>, <b>{votes.filter((v) => v === 0).length}</b> say <b>{className(run, 0)}</b> → forest predicts <b>{className(run, votes.filter((v) => v === 1).length * 2 > votes.length ? 1 : 0)}</b>.</>}
              {click !== null && !clf && <>At x = {fmt(click.x, 2)} the trees predict between <b>{fmt(Math.min(...votes), 1)}</b> and <b>{fmt(Math.max(...votes), 1)}</b>; their average is <b>{fmt(votes.reduce((s, v) => s + v, 0) / votes.length, 1)}</b>.</>}
            </Callout>
          </div>
        </div>
      </Card>
    </div>
  )
}
