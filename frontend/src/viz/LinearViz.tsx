import { useMemo, useState } from 'react'
import { axes, Points } from '../components/DataPoints'
import { ChartNote, Guide, Narration } from '../components/Explain'
import { HeatGrid, Plot } from '../components/Plot'
import { Card, fmt, Legend, PlayerBar, usePlayer } from '../components/ui'
import type { VizProps } from '../types'

interface Frame { step: number; w: number; b: number; loss: number }

export function LinearViz({ run }: VizProps) {
  const R = run.result
  const path: Frame[] = R.gd.path
  const p = usePlayer(path.length, 10)
  const f = path[p.i]
  const prev = path[Math.max(0, p.i - 1)]
  const a = axes(run)
  const { data } = run
  const trainIdx = useMemo(() => data.is_test.flatMap((t, i) => (t ? [] : [i])), [data.is_test])
  const [pick, setPick] = useState<number | null>(null)
  const k = pick ?? trainIdx[0]
  const xk = data.X[k][0]
  const yk = data.y[k]
  const yhat = f.w * xk + f.b
  const m = R.model
  const xName = data.feature_names[0]
  const yName = data.target_name

  const { ws, bs, z } = R.surface as { ws: number[]; bs: number[]; z: number[][] }
  const flat = z.flat()
  const lo = Math.log(Math.max(Math.min(...flat), 1e-3))
  const hi = Math.log(Math.max(...flat))
  const heat = (v: number) => `color-mix(in srgb, var(--accent) ${Math.round(100 * (1 - (Math.log(Math.max(v, 1e-3)) - lo) / (hi - lo || 1)))}%, var(--panel))`
  const lossMax = Math.max(...path.map((q) => q.loss))
  const narration = narrate(path, p.i, R.gd.diverged, m, trainIdx.map((i) => data.y[i] - (f.w * a.px[i] + f.b)), xName, yName, prev)

  return (
    <div className="stack">
      <Guide
        title="Watch gradient descent find the best line"
        intro="The model starts with a terrible guess and improves it one small step at a time. Use **Play**, or **Next** to go one step at a time."
        steps={[
          '**Chart 1** shows the training data and the current line. The red dashes are the mistakes (**residuals**).',
          '**Chart 2** is a map of every possible line. The purple dot is the current line; darker colour means a smaller mistake. Watch the dot roll downhill.',
          '**Chart 3** tracks the overall mistake (**MSE**) after each step.',
          'The purple panel below the player explains every step as it happens.',
          'Click any dot in chart 1 to see its prediction worked out by hand.',
        ]}
      />
      <PlayerBar p={p} label={(i) => `step ${path[i].step} of ${path[path.length - 1].step}`} />
      <Narration {...narration} />

      <div className="grid2">
        <Card title="1 · The line and its mistakes">
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={380}>
            {(ctx) => (
              <>
                {trainIdx.map((i) => (
                  <line key={i} x1={ctx.sx(a.px[i])} x2={ctx.sx(a.px[i])} y1={ctx.sy(a.py[i])} y2={ctx.sy(f.w * a.px[i] + f.b)}
                    stroke="var(--bad)" strokeWidth={1.4} strokeDasharray="3 2" opacity={0.75} />
                ))}
                <line x1={ctx.sx(a.xDomain[0])} x2={ctx.sx(a.xDomain[1])} y1={ctx.sy(m.w * a.xDomain[0] + m.b)} y2={ctx.sy(m.w * a.xDomain[1] + m.b)}
                  stroke="var(--good)" strokeWidth={2} strokeDasharray="7 5" opacity={0.8} />
                <line x1={ctx.sx(a.xDomain[0])} x2={ctx.sx(a.xDomain[1])} y1={ctx.sy(f.w * a.xDomain[0] + f.b)} y2={ctx.sy(f.w * a.xDomain[1] + f.b)}
                  stroke="var(--accent)" strokeWidth={3.2} />
                <Points run={run} ctx={ctx} show="train" selected={k} onSelect={setPick} />
              </>
            )}
          </Plot>
          <Legend items={[
            { color: 'var(--accent)', label: 'current line' },
            { color: 'var(--good)', label: 'exact best line' },
            { color: 'var(--bad)', label: 'residuals (mistakes)' },
          ]} />
          <ChartNote
            read={`Each blue dot is one training student (${xName} → ${yName}). The purple line is the model's current guess. Each red dash is that student's **residual**: the gap between the real value and the line. The green dashed line is the exact best answer, shown for reference.`}
            look="The purple line swinging up onto the green one, and the red dashes getting shorter."
          />
        </Card>

        <Card title="2 · Rolling down the error landscape">
          <Plot xDomain={[ws[0], ws[ws.length - 1]]} yDomain={[bs[0], bs[bs.length - 1]]} xLabel="slope w" yLabel="intercept b" height={380}>
            {(ctx) => (
              <>
                <HeatGrid xs={ws} ys={bs} values={flat} ctx={ctx} color={heat} opacity={0.85} />
                <polyline fill="none" stroke="var(--ink)" strokeWidth={1.6}
                  points={path.slice(0, p.i + 1).map((q) => `${ctx.sx(q.w)},${ctx.sy(q.b)}`).join(' ')} />
                <circle cx={ctx.sx(m.w)} cy={ctx.sy(m.b)} r={6} fill="none" stroke="var(--good)" strokeWidth={2.5} />
                <circle cx={ctx.sx(f.w)} cy={ctx.sy(f.b)} r={6} fill="var(--accent)" stroke="var(--panel)" strokeWidth={2} />
              </>
            )}
          </Plot>
          <Legend items={[{ color: 'var(--accent)', label: 'current line' }, { color: 'var(--good)', label: 'best possible line', ring: true }, { color: 'var(--ink)', label: 'path so far' }]} />
          <ChartNote
            read="Every spot on this map is one possible line: left–right is its **slope**, up–down is its **intercept**. The colour shows how wrong that line would be (darker = smaller **MSE**). It is like a valley seen from above."
            look="The dot heading quickly into the dark valley, then creeping along the valley floor towards the green ring (the bottom)."
          />
        </Card>
      </div>

      <div className="grid2">
        <Card title="3 · The mistake shrinking">
          <Plot xDomain={[0, path[path.length - 1].step || 1]} yDomain={[0, lossMax * 1.05]} xLabel="gradient descent step" yLabel="MSE" height={300}>
            {(ctx) => (
              <>
                <polyline fill="none" stroke="var(--c0)" strokeWidth={2.2} points={path.map((q) => `${ctx.sx(q.step)},${ctx.sy(q.loss)}`).join(' ')} />
                <circle cx={ctx.sx(f.step)} cy={ctx.sy(f.loss)} r={5.5} fill="var(--accent)" />
              </>
            )}
          </Plot>
          <ChartNote
            read="Left–right: how many steps have been taken. Up–down: the **MSE**, the average squared mistake over all training students. The purple dot is where we are now."
            look="A steep drop at first (big mistakes → big steps), then a long flat tail (only fine-tuning left)."
          />
        </Card>

        <Card title="4 · One student, worked out by hand">
          <p className="small muted">Click any dot in chart 1 to pick a different student. The numbers update as the line changes.</p>
          <table className="ex" style={{ width: '100%' }}>
            <tbody>
              <tr><td>Student #{k}</td><td>{xName} = <b>{fmt(xk, 2)}</b>, real {yName} = <b>{fmt(yk, 2)}</b></td></tr>
              <tr><td>Current line</td><td>{yName} = {fmt(f.w, 2)} × {xName} + {fmt(f.b, 2)}</td></tr>
              <tr><td>Prediction</td><td>{fmt(f.w, 2)} × {fmt(xk, 2)} + {fmt(f.b, 2)} = <b>{fmt(yhat, 2)}</b></td></tr>
              <tr><td>Residual (mistake)</td><td>{fmt(yk, 2)} − {fmt(yhat, 2)} = <b>{fmt(yk - yhat, 2)}</b> {yk - yhat > 0 ? '(line is too low here)' : '(line is too high here)'}</td></tr>
              <tr><td>Squared mistake</td><td><b>{fmt((yk - yhat) ** 2, 2)}</b></td></tr>
            </tbody>
          </table>
          <p className="small" style={{ marginTop: '.7rem' }}>
            Do this for all {trainIdx.length} training students and average the squared mistakes → that is the MSE of <b>{fmt(f.loss, 2)}</b> shown in chart 3.
          </p>
        </Card>
      </div>
    </div>
  )
}

function narrate(path: Frame[], i: number, diverged: boolean, m: { w: number; b: number }, resid: number[], xName: string, yName: string, prev: Frame) {
  const f = path[i]
  const first = path[0]
  const last = path[path.length - 1]
  const dw = f.w - prev.w
  const db = f.b - prev.b
  const above = resid.filter((r) => r > 0).length
  const share = Math.round((above / resid.length) * 100)

  if (i === 0) {
    return {
      stage: 'Step 0 · starting guess', title: 'The model starts knowing nothing.',
      lines: [
        `The line is flat at zero: **slope** 0 and **intercept** 0, so every student is predicted to score 0.`,
        `So every red dash in chart 1 is a full-size mistake. Their squares averaged give an **MSE** of **${fmt(f.loss, 1)}**.`,
        'Press **Play** or **Next** to start **gradient descent**.',
      ],
    }
  }
  if (diverged && i >= path.length - 3) {
    return {
      stage: `Step ${f.step} · something went wrong`, tone: 'warn' as const, title: 'The mistakes are exploding instead of shrinking.',
      lines: [
        'The **learning rate** is too big. Each step jumps right over the bottom of the valley and lands higher up on the other side, so every step makes things worse.',
        'Lower the learning rate in the left panel and watch again.',
      ],
    }
  }
  if (i === path.length - 1) {
    const close = Math.abs(f.w - m.w) < 0.05 * Math.abs(m.w || 1) && Math.abs(f.b - m.b) < 0.05 * Math.abs(m.b || 1)
    return {
      stage: `Step ${f.step} · finished`, tone: 'good' as const,
      title: `Learned rule: ${yName} = ${fmt(f.w, 2)} × ${xName} + ${fmt(f.b, 2)}`,
      lines: [
        `The **MSE** fell from **${fmt(first.loss, 1)}** to **${fmt(f.loss, 2)}**.`,
        close
          ? `That matches the exact best line (slope ${fmt(m.w, 2)}, intercept ${fmt(m.b, 2)}): gradient descent found the bottom of the valley on its own.`
          : `The exact best line is slope ${fmt(m.w, 2)}, intercept ${fmt(m.b, 2)}, so we are not fully there yet. More steps (left panel) would close the gap.`,
        'Open the **Results** tab to see how well this line predicts the hidden test students.',
      ],
    }
  }
  const progress = (first.loss - f.loss) / Math.max(first.loss - last.loss, 1e-9)
  const moves = [
    Math.abs(dw) > 1e-4 ? `the slope ${dw > 0 ? 'went up' : 'went down'} (${fmt(prev.w, 2)} → ${fmt(f.w, 2)}, the line got ${dw > 0 ? 'steeper' : 'flatter'})` : null,
    Math.abs(db) > 1e-4 ? `the intercept ${db > 0 ? 'went up' : 'went down'} (${fmt(prev.b, 2)} → ${fmt(f.b, 2)}, the whole line ${db > 0 ? 'moved up' : 'moved down'})` : null,
  ].filter(Boolean).join(' and ')

  if (progress < 0.9) {
    return {
      stage: `Step ${f.step} · big corrections`, title: `MSE ${fmt(prev.loss, 1)} → ${fmt(f.loss, 1)}`,
      lines: [
        `Since the last frame ${moves || 'the line barely moved'}.`,
        share >= 50
          ? `Why: ${share}% of the students are still above the line, so the **gradient** says "push the line up". The mistakes are big, so the steps are big.`
          : `Why: ${100 - share}% of the students are now below the line, so the **gradient** says "pull the line down". The mistakes are still big, so the steps are big.`,
      ],
    }
  }
  return {
    stage: `Step ${f.step} · fine-tuning`, title: `Almost there: MSE ${fmt(f.loss, 2)}`,
    lines: [
      `The line is already close to the best one. This step changed the MSE by only ${fmt(prev.loss - f.loss, 3)}.`,
      'In chart 2 the dot is near the valley floor, where the ground is almost flat. A flat slope means a small **gradient**, and so tiny steps.',
      `About ${share}% of students are above the line and ${100 - share}% below: the line now runs through the middle of the cloud.`,
    ],
  }
}
