/** Minimal linear scale with "nice" tick values — replaces the one thing we used from d3. */
export interface LinearScale {
  (v: number): number
  invert: (px: number) => number
  ticks: (count?: number) => number[]
}

export function scaleLinear(domain: [number, number], range: [number, number]): LinearScale {
  const [d0, d1] = domain
  const [r0, r1] = range
  const k = (r1 - r0) / (d1 - d0 || 1)
  const f = ((v: number) => r0 + (v - d0) * k) as LinearScale
  f.invert = (px) => d0 + (px - r0) / k
  f.ticks = (count = 6) => {
    const lo = Math.min(d0, d1)
    const hi = Math.max(d0, d1)
    const raw = (hi - lo) / count
    const pow = 10 ** Math.floor(Math.log10(raw || 1))
    const err = raw / pow
    const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * pow
    const out: number[] = []
    for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(+t.toFixed(10))
    return out
  }
  return f
}
