import { useState } from 'react'
import { axes, className, pointLegend, Points } from '../components/DataPoints'
import { ChartNote, Guide, Narration } from '../components/Explain'
import { classColor, HeatGrid, Plot, probColor } from '../components/Plot'
import { Card, fmt, Legend, Slider } from '../components/ui'
import type { VizProps } from '../types'

interface Node { f: number; t: number; l: number; r: number; n: number; imp: number; v: number | number[] }

/** Compact text view of a decision tree: each line is one question, indentation = depth. */
function TreeView({ nodes, names, classes, clf, maxDepth = 3 }: { nodes: Node[]; names: string[]; classes: string[]; clf: boolean; maxDepth?: number }) {
  const rows: { depth: number; text: string; leaf: boolean; color?: string }[] = []
  const walk = (i: number, depth: number, prefix: string) => {
    const nd = nodes[i]
    const leaf = nd.l === -1
    if (leaf || depth >= maxDepth) {
      let text = prefix
      let color: string | undefined
      if (clf) {
        const v = nd.v as number[]
        const k = v[1] > v[0] ? 1 : 0
        text += `→ ${classes[k]} (${Math.round(v[k] * 100)}% of ${nd.n} pts)`
        color = classColor(k)
      } else {
        text += `→ predict ${fmt(nd.v as number, 1)} (average of ${nd.n} pts)`
      }
      rows.push({ depth, text: text + (!leaf ? '  …more questions below' : ''), leaf: true, color })
      return
    }
    rows.push({ depth, text: `${prefix}is ${names[nd.f]} ≤ ${fmt(nd.t, 2)}?  (${nd.n} pts, Gini ${fmt(nd.imp, 2)})`, leaf: false })
    walk(nd.l, depth + 1, 'yes ')
    walk(nd.r, depth + 1, 'no  ')
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

const depthOf = (nodes: Node[], i = 0): number => (nodes[i].l === -1 ? 0 : 1 + Math.max(depthOf(nodes, nodes[i].l), depthOf(nodes, nodes[i].r)))

export function ForestViz({ run }: VizProps) {
  const R = run.result
  const clf = run.task === 'classification'
  const a = axes(run)
  const { data } = run
  const [tree, setTree] = useState(0)
  const [kTrees, setK] = useState(1)
  const [click, setClick] = useState<{ x: number; y: number } | null>(null)
  const t = Math.min(tree, R.shown_trees - 1)
  const trainIdx = data.is_test.flatMap((x, i) => (x ? [] : [i]))
  const inBag: number[] = R.trees[t].in_bag
  const nodes: Node[] = R.trees[t].nodes
  const nx = R.grid.xs.length
  const cell = (cx: number, cy: number | null) => {
    const near = (arr: number[], v: number) => arr.reduce((bi, x, i) => (Math.abs(x - v) < Math.abs(arr[bi] - v) ? i : bi), 0)
    return cy === null ? near(R.grid.xs, cx) : near(R.grid.ys, cy) * nx + near(R.grid.xs, cx)
  }
  const treeGrid: number[][] = R.tree_grid
  const k = Math.min(kTrees, R.n_trees)
  const forest = treeGrid[0].map((_, c) => treeGrid.slice(0, k).reduce((s, g) => s + g[c], 0) / k)
  const clicked = click ? (clf ? cell(click.x, click.y) : cell(click.x, null)) : null
  const votes = clicked !== null ? treeGrid.slice(0, k).map((g) => g[clicked]) : []
  const sizeOf = (i: number) => { const ti = trainIdx.indexOf(i); return ti >= 0 ? inBag[ti] : 0 }

  const A = className(run, 0)
  const B = className(run, 1)
  const leaves = nodes.filter((n) => n.l === -1).length
  const root = nodes[0]
  const dup = inBag.filter((c) => c > 1).length
  const oob = inBag.filter((c) => c === 0).length
  const metric = clf ? 'accuracy' : 'error (RMSE)'
  const show = (v: number) => (clf ? `${fmt(v * 100, 1)}%` : fmt(v, 2))
  const singleAvg = R.single_tree_scores.reduce((s: number, v: number) => s + v, 0) / R.single_tree_scores.length

  return (
    <div className="stack">
      <Guide
        title="See one tree, then see the whole forest vote"
        intro="A random forest is many **decision trees** whose answers are combined. This page has two parts: first look at single trees, then combine them."
        steps={[
          '**Part 1:** click Tree 1, 2, 3… Each tree learned from its own random sample of the data (a **bootstrap** sample). See which points it got and which questions it asks.',
          '**Part 2:** drag the "Number of trees combined" slider from 1 upward and watch the jagged single-tree answer become smooth.',
          'Click anywhere on the Part 2 chart to see how the trees vote at that spot.',
        ]}
      />

      <Card title={`Part 1 · One tree (tree ${t + 1} of ${R.n_trees})`}>
        <div className="chip-row">
          {Array.from({ length: R.shown_trees }, (_, i) => (
            <button key={i} className={'chip-btn' + (i === t ? ' on' : '')} onClick={() => setTree(i)}>Tree {i + 1}</button>
          ))}
          {R.n_trees > R.shown_trees && <span className="small muted" style={{ alignSelf: 'center' }}>(showing the first {R.shown_trees})</span>}
        </div>
        <Narration
          stage={`Tree ${t + 1}`}
          title={`This tree saw ${inBag.length - oob} different points out of ${inBag.length}.`}
          lines={[
            `Its random sample picked ${dup} points more than once (big dots) and never picked ${oob} points (hollow dots). Those unseen points are this tree's **out-of-bag** points.`,
            root.l === -1
              ? 'This tree has no questions: all its points were the same, so it gives one answer everywhere.'
              : `Its first question is **"is ${data.feature_names[root.f]} ≤ ${fmt(root.t, 2)}?"**. It ends up asking questions ${depthOf(nodes)} levels deep and finishes with ${leaves} end boxes (**leaves**).`,
            'Click another tree: different sample → different questions → different answer. That variety is the whole point.',
          ]}
        />
        <div className="grid2" style={{ marginTop: '1rem' }}>
          <div>
            <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={340}>
              {(ctx) => (
                <>
                  {clf && <HeatGrid xs={R.grid.xs} ys={R.grid.ys} values={treeGrid[t]} ctx={ctx} color={(v) => (v > 0.5 ? classColor(1) : classColor(0))} opacity={0.28} />}
                  {!clf && (
                    <polyline fill="none" stroke="var(--accent)" strokeWidth={2.8}
                      points={R.grid.xs.map((x: number, i: number) => `${ctx.sx(x)},${ctx.sy(treeGrid[t][i])}`).join(' ')} />
                  )}
                  {trainIdx.map((i) => {
                    const c = sizeOf(i)
                    const col = clf ? classColor(data.y[i]) : 'var(--c0)'
                    return (
                      <circle key={i} cx={ctx.sx(a.px[i])} cy={ctx.sy(a.py[i])} r={c === 0 ? 3.2 : 3.2 + c * 1.5}
                        fill={c === 0 ? 'none' : col} stroke={c === 0 ? col : 'var(--panel)'} strokeWidth={c === 0 ? 1.4 : 1} opacity={c === 0 ? 0.55 : 0.9} />
                    )
                  })}
                </>
              )}
            </Plot>
            <ChartNote
              read={clf
                ? `Dots are training points coloured by their real class. **Big dot** = drawn into this tree's sample several times; **hollow dot** = never drawn. The shaded boxes are what this one tree predicts: blue area → ${A}, orange area → ${B}.`
                : '**Big dot** = drawn into this tree\'s sample several times; **hollow dot** = never drawn. The purple line is what this one tree predicts.'}
              look={clf ? 'Only straight, box-shaped edges: each question cuts the chart along one axis.' : 'A staircase: a tree predicts one flat value per leaf, so its answer jumps in steps.'}
            />
          </div>
          <div>
            <h4>The questions this tree asks</h4>
            <TreeView nodes={nodes} names={data.feature_names} classes={[A, B]} clf={clf} />
            <ChartNote
              read={'Start at the top line. If the answer is yes, go to the indented "yes" line below it, otherwise go to "no". Keep going until a line with an arrow (→), which is a **leaf** with the answer. **Gini** shows how mixed the points at that question are (0 = all one class).'}
              look="Gini getting smaller as you go deeper: every question makes the groups purer."
            />
          </div>
        </div>
      </Card>

      <Card title="Part 2 · The forest votes">
        <Slider label="Number of trees combined" value={k} min={1} max={R.n_trees} step={1} onChange={setK}
          help="Start at 1 and drag right." />
        <Narration
          stage={`${k} tree${k > 1 ? 's' : ''} combined`}
          tone={k === R.n_trees ? 'good' : undefined}
          title={k === 1
            ? `One tree alone: test ${metric} ${show(R.curve[0])}`
            : `${k} trees together: test ${metric} ${show(R.curve[k - 1])}`}
          lines={k === 1
            ? ['A single tree is blocky and jumpy: it follows its own random sample too closely, flukes included.', 'Drag the slider right to add more trees and watch the answer change.']
            : [
              clf
                ? `Each tree votes; the background shows the share of trees voting ${B}. Strong colour = trees agree, pale = they disagree.`
                : 'Each grey line is one tree; the purple line is their average. The individual jumps cancel out.',
              `For comparison, a single tree on its own scores ${show(singleAvg)} on average. ${(clf ? R.curve[k - 1] > singleAvg : R.curve[k - 1] < singleAvg) ? 'The team already beats the typical individual tree.' : 'With only a few trees the team is still shaky.'}`,
              k === R.n_trees ? 'This is the full forest. Adding more trees beyond this point mostly just makes it smoother and more stable.' : '',
            ].filter(Boolean)}
        />
        <div className="grid2" style={{ marginTop: '1rem' }}>
          <div>
            <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={340} onPlotClick={(x, y) => setClick({ x, y })}>
              {(ctx) => (
                <>
                  {clf && <HeatGrid xs={R.grid.xs} ys={R.grid.ys} values={forest} ctx={ctx} color={probColor} />}
                  {!clf && treeGrid.slice(0, k).map((g, ti) => (
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
            <Legend items={clf ? pointLegend(run) : [{ color: 'var(--accent)', label: 'forest (average)' }, { color: 'var(--muted)', label: 'individual trees' }]} />
            <div className="callout" style={{ marginTop: '.6rem' }}>
              {click === null && <><b>Click anywhere on this chart</b> to see how the {k} tree{k > 1 ? 's' : ''} vote at that spot.</>}
              {click !== null && clf && <>At that spot <b>{votes.filter((v) => v === 1).length}</b> tree(s) say <b>{B}</b> and <b>{votes.filter((v) => v === 0).length}</b> say <b>{A}</b>, so the forest answers <b>{className(run, votes.filter((v) => v === 1).length * 2 > votes.length ? 1 : 0)}</b>.</>}
              {click !== null && !clf && <>At {data.feature_names[0]} = {fmt(click.x, 2)} the trees answer between <b>{fmt(Math.min(...votes), 1)}</b> and <b>{fmt(Math.max(...votes), 1)}</b>. Their average, <b>{fmt(votes.reduce((s, v) => s + v, 0) / votes.length, 1)}</b>, is the forest's answer.</>}
            </div>
          </div>
          <div>
            <Plot xDomain={[1, Math.max(2, R.n_trees)]} yDomain={[Math.min(...R.curve, ...R.single_tree_scores) * 0.97, Math.max(...R.curve, ...R.single_tree_scores) * 1.03]}
              xLabel="number of trees" yLabel={clf ? 'test accuracy (higher = better)' : 'test RMSE (lower = better)'} height={260}>
              {(ctx) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={2.4} points={R.curve.map((v: number, i: number) => `${ctx.sx(i + 1)},${ctx.sy(v)}`).join(' ')} />
                  {R.single_tree_scores.map((v: number, i: number) => <circle key={i} cx={ctx.sx(i + 1)} cy={ctx.sy(v)} r={2.6} fill="var(--muted)" opacity={0.6} />)}
                  <circle cx={ctx.sx(k)} cy={ctx.sy(R.curve[k - 1])} r={6} fill="var(--accent)" />
                </>
              )}
            </Plot>
            <ChartNote
              read={`Scores on the hidden **test set**. The blue line is the forest built from the first k trees; each grey dot is one tree on its own. The purple dot marks the slider position.`}
              look="The blue line sitting better than most grey dots, and settling down as trees are added. A crowd of trees beats most of its individual members."
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
