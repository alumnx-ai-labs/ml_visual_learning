import type { RunResponse } from '../types'
import { classColor, extent, type PlotCtx } from './Plot'

/** Where each data point sits on a 2-D chart: regression = (feature, target); classification = (feature 1, feature 2). */
export function axes(run: RunResponse) {
  const { data, task } = run
  const reg = task === 'regression'
  const px = data.X.map((r) => r[0])
  const py = reg ? data.y : data.X.map((r) => r[1])
  return {
    px,
    py,
    xLabel: data.feature_names[0],
    yLabel: reg ? data.target_name : data.feature_names[1],
    xDomain: extent(px),
    yDomain: extent(py),
  }
}

export const className = (run: RunResponse, k: number) => run.data.classes?.[k] ?? `class ${k}`

interface PointsProps {
  run: RunResponse
  ctx: PlotCtx
  selected?: number | null
  /** Which points to draw. Test points are drawn as hollow rings so they can never be confused with training data. */
  show?: 'all' | 'train' | 'test'
  radius?: number
  fill?: (i: number) => string
  onSelect?: (i: number) => void
}

export function Points({ run, ctx, selected, show = 'all', radius = 4.5, fill, onSelect }: PointsProps) {
  const { data, task } = run
  const { px, py } = axes(run)
  return (
    <g>
      {px.map((x, i) => {
        const test = data.is_test[i]
        if ((show === 'train' && test) || (show === 'test' && !test)) return null
        const color = fill ? fill(i) : task === 'regression' ? 'var(--c0)' : classColor(data.y[i])
        return (
          <circle
            key={i}
            cx={ctx.sx(x)}
            cy={ctx.sy(py[i])}
            r={selected === i ? radius + 3 : radius}
            fill={test ? 'var(--panel)' : color}
            stroke={test ? color : selected === i ? 'var(--ink)' : 'var(--panel)'}
            strokeWidth={test ? 2.2 : selected === i ? 2.5 : 1}
            opacity={0.92}
            onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(i) } : undefined}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          />
        )
      })}
    </g>
  )
}

export function pointLegend(run: RunResponse): { color: string; label: string; ring?: boolean }[] {
  if (run.task === 'regression') {
    return [
      { color: 'var(--c0)', label: 'training point' },
      { color: 'var(--c0)', label: 'test point (hidden from training)', ring: true },
    ]
  }
  return [
    { color: classColor(0), label: className(run, 0) },
    { color: classColor(1), label: className(run, 1) },
    { color: 'var(--ink)', label: 'hollow ring = test point', ring: true },
  ]
}
