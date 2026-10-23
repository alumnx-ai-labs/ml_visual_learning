import { scaleLinear } from './scale'
import { useId, type ReactNode } from 'react'

export type Scale = (v: number) => number
export const CLASS_COLORS = ['var(--c0)', 'var(--c1)', 'var(--c2)', 'var(--c3)']
export const classColor = (i: number) => CLASS_COLORS[i % CLASS_COLORS.length]

const W = 640
const M = { l: 54, r: 16, t: 14, b: 46 }

export interface PlotCtx {
  sx: Scale
  sy: Scale
  ix: Scale
  iy: Scale
  w: number
  h: number
  clipId: string
}

interface Props {
  xDomain: [number, number]
  yDomain: [number, number]
  xLabel?: string
  yLabel?: string
  height?: number
  onPlotClick?: (x: number, y: number) => void
  /** set false to hide the x grid and tick labels (e.g. for a dendrogram whose x positions are just leaf slots) */
  xTicks?: boolean
  children: (c: PlotCtx) => ReactNode
}

/** A small SVG chart frame: axes, grid and scales. Children draw in data coordinates via sx/sy. */
export function Plot({ xDomain, yDomain, xLabel, yLabel, height = 400, onPlotClick, xTicks = true, children }: Props) {
  const clipId = useId().replace(/:/g, '')
  const w = W - M.l - M.r
  const h = height - M.t - M.b
  const sx = scaleLinear(xDomain, [0, w])
  const sy = scaleLinear(yDomain, [h, 0])
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toExponential(0) : String(+v.toFixed(2)))

  const handle = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlotClick) return
    const box = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W - M.l
    const py = ((e.clientY - box.top) / box.height) * height - M.t
    if (px < 0 || py < 0 || px > w || py > h) return
    onPlotClick(sx.invert(px), sy.invert(py))
  }

  return (
    <svg className="plot" viewBox={`0 0 ${W} ${height}`} onClick={handle} style={{ cursor: onPlotClick ? 'crosshair' : undefined }}>
      <defs>
        <clipPath id={clipId}>
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <g transform={`translate(${M.l},${M.t})`}>
        <g className="grid">
          {xTicks && sx.ticks(6).map((t) => (
            <line key={'gx' + t} x1={sx(t)} x2={sx(t)} y1={0} y2={h} />
          ))}
          {sy.ticks(6).map((t) => (
            <line key={'gy' + t} x1={0} x2={w} y1={sy(t)} y2={sy(t)} />
          ))}
        </g>
        <g clipPath={`url(#${clipId})`}>
          {children({ sx, sy, ix: sx.invert, iy: sy.invert, w, h, clipId })}
        </g>
        <line className="axis-line" x1={0} x2={w} y1={h} y2={h} />
        <line className="axis-line" x1={0} x2={0} y1={0} y2={h} />
        {xTicks && sx.ticks(6).map((t) => (
          <text key={'tx' + t} x={sx(t)} y={h + 16} textAnchor="middle">{fmt(t)}</text>
        ))}
        {sy.ticks(6).map((t) => (
          <text key={'ty' + t} x={-8} y={sy(t) + 4} textAnchor="end">{fmt(t)}</text>
        ))}
        {xLabel && <text className="axis-label" x={w / 2} y={h + 38} textAnchor="middle">{xLabel}</text>}
        {yLabel && (
          <text className="axis-label" transform={`translate(-42,${h / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
        )}
      </g>
    </svg>
  )
}

export function extent(values: number[], pad = 0.06): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const v of values) {
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  const p = (hi - lo || 1) * pad
  return [lo - p, hi + p]
}

/** Colour-coded heat cells for a regular grid (row-major, y outer / x inner). value ∈ [0,1] for classification. */
export function HeatGrid({ xs, ys, values, ctx, color, opacity = 0.3 }: { xs: number[]; ys: number[]; values: number[]; ctx: PlotCtx; color: (v: number) => string; opacity?: number }) {
  const dx = (xs[1] - xs[0]) / 2
  const dy = (ys[1] - ys[0]) / 2
  return (
    <g shapeRendering="crispEdges" opacity={opacity}>
      {ys.map((y, j) =>
        xs.map((x, i) => (
          <rect
            key={i + '_' + j}
            x={ctx.sx(x - dx)}
            y={ctx.sy(y + dy)}
            width={Math.abs(ctx.sx(x + dx) - ctx.sx(x - dx)) + 0.6}
            height={Math.abs(ctx.sy(y - dy) - ctx.sy(y + dy)) + 0.6}
            fill={color(values[j * xs.length + i])}
          />
        )),
      )}
    </g>
  )
}

/** Blend class-0 colour -> class-1 colour by probability p. */
export const probColor = (p: number) =>
  `color-mix(in srgb, ${CLASS_COLORS[1]} ${Math.round(Math.min(1, Math.max(0, p)) * 100)}%, ${CLASS_COLORS[0]})`
