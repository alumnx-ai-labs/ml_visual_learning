import { Plot } from './Plot'

const sig = (z: number) => 1 / (1 + Math.exp(-z))

/** Small static illustrations used inside lesson chapters. */
export function Figure({ kind }: { kind: string }) {
  if (kind === 'toyLine') {
    const pts = [[1, 45], [3, 52], [5, 68], [7, 74]]
    const line = (x: number) => 5 * x + 40
    return (
      <figure className="fig">
        <Plot xDomain={[0, 8]} yDomain={[38, 82]} xLabel="hours studied" yLabel="exam score" height={300}>
          {(c) => (
            <>
              <line x1={c.sx(0)} y1={c.sy(line(0))} x2={c.sx(8)} y2={c.sy(line(8))} stroke="var(--accent)" strokeWidth={3} />
              {pts.map(([x, y]) => (
                <g key={x}>
                  <line x1={c.sx(x)} x2={c.sx(x)} y1={c.sy(y)} y2={c.sy(line(x))} stroke="var(--bad)" strokeWidth={2} strokeDasharray="4 3" />
                  <circle cx={c.sx(x)} cy={c.sy(y)} r={7} fill="var(--c0)" stroke="#fff" strokeWidth={2} />
                  <text x={c.sx(x) + 10} y={(c.sy(y) + c.sy(line(x))) / 2 + 4} style={{ fill: 'var(--bad)', fontWeight: 700 }}>
                    {y - line(x) === 0 ? '0' : (y - line(x) > 0 ? '+' : '') + (y - line(x))}
                  </text>
                </g>
              ))}
            </>
          )}
        </Plot>
        <figcaption>Line A (ŷ = 5x + 40). Red dashes are the residuals: the vertical gap between each student and the line.</figcaption>
      </figure>
    )
  }

  if (kind === 'sigmoid') {
    const zs = Array.from({ length: 81 }, (_, i) => -8 + i * 0.2)
    return (
      <figure className="fig">
        <Plot xDomain={[-8, 8]} yDomain={[-0.04, 1.04]} xLabel="score z (evidence)" yLabel="probability" height={260}>
          {(c) => (
            <>
              <rect x={0} y={0} width={c.sx(0)} height={c.h} fill="var(--c0)" opacity={0.07} />
              <rect x={c.sx(0)} y={0} width={c.w - c.sx(0)} height={c.h} fill="var(--c1)" opacity={0.09} />
              <line x1={0} x2={c.w} y1={c.sy(0.5)} y2={c.sy(0.5)} stroke="var(--muted)" strokeDasharray="4 4" />
              <polyline fill="none" stroke="var(--accent)" strokeWidth={3.5} points={zs.map((z) => `${c.sx(z)},${c.sy(sig(z))}`).join(' ')} />
              {[-4, -2, 0, 2, 4].map((z) => <circle key={z} cx={c.sx(z)} cy={c.sy(sig(z))} r={5} fill="var(--accent)" stroke="#fff" strokeWidth={2} />)}
              <text x={c.sx(-7.5)} y={c.sy(0.9)} style={{ fontWeight: 700 }}>predict fail</text>
              <text x={c.sx(4.2)} y={c.sy(0.1)} style={{ fontWeight: 700 }}>predict pass</text>
            </>
          )}
        </Plot>
        <figcaption>The sigmoid squashes any score into 0–1. Exactly at z = 0 the model is 50/50: that is the decision boundary.</figcaption>
      </figure>
    )
  }

  if (kind === 'boosting') {
    const actual = [200, 250, 300, 450]
    const stages = [
      { t: 'Start: average', p: [300, 300, 300, 300] },
      { t: 'After tree 1', p: [275, 275, 275, 375] },
      { t: 'After tree 2', p: [250, 250, 300, 400] },
    ]
    return (
      <figure className="fig">
        <div className="fig-row">
          {stages.map((s) => (
            <svg key={s.t} viewBox="0 0 200 170" className="mini">
              <text x={100} y={14} textAnchor="middle" style={{ fontWeight: 700, fill: 'var(--ink)', fontSize: 12 }}>{s.t}</text>
              {actual.map((a, i) => {
                const x = 25 + i * 45
                const y = (v: number) => 160 - (v - 150) * 0.42
                return (
                  <g key={i}>
                    <rect x={x} y={y(a)} width={16} height={160 - y(a)} fill="var(--c0)" opacity={0.25} rx={2} />
                    <rect x={x + 16} y={y(s.p[i])} width={16} height={160 - y(s.p[i])} fill="var(--accent)" rx={2} />
                    <line x1={x + 8} x2={x + 24} y1={y(a)} y2={y(a)} stroke="var(--c0)" strokeWidth={2} />
                  </g>
                )
              })}
            </svg>
          ))}
        </div>
        <figcaption>Light bars: actual price of houses A–D. Dark bars: model prediction. Each new tree closes part of the remaining gap.</figcaption>
      </figure>
    )
  }

  if (kind === 'bootstrap') {
    const rows = [[2, 5, 5, 1, 7, 2, 8, 3], [6, 6, 3, 4, 1, 8, 8, 4], [1, 7, 2, 2, 5, 6, 3, 3]]
    return (
      <figure className="fig">
        <div className="boot">
          <div className="boot-src">{[1, 2, 3, 4, 5, 6, 7, 8].map((r) => <span key={r} className="chip">{r}</span>)}</div>
          {rows.map((r, t) => {
            const counts = new Map<number, number>()
            r.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1))
            return (
              <div key={t} className="boot-tree">
                <b>Tree {t + 1}</b>
                <div>{[1, 2, 3, 4, 5, 6, 7, 8].map((v) => <span key={v} className={'chip' + (counts.get(v) ? '' : ' out')}>{v}{(counts.get(v) ?? 0) > 1 ? ` ×${counts.get(v)}` : ''}</span>)}</div>
              </div>
            )
          })}
        </div>
        <figcaption>Original 8 rows (top). Each tree draws 8 rows with replacement: some rows repeat (×2), faded rows were never drawn (out-of-bag).</figcaption>
      </figure>
    )
  }

  if (kind === 'mlLoop') {
    const box = (x: number, label: string, sub: string, accent = false) => (
      <g transform={`translate(${x},20)`}>
        <rect width={150} height={70} rx={14} fill={accent ? 'var(--accent)' : 'var(--panel2)'} stroke={accent ? 'var(--accent)' : 'var(--line)'} />
        <text x={75} y={32} textAnchor="middle" style={{ fontWeight: 700, fontSize: 14, fill: accent ? '#fff' : 'var(--ink)' }}>{label}</text>
        <text x={75} y={52} textAnchor="middle" style={{ fontSize: 11, fill: accent ? '#e0e7ff' : 'var(--muted)' }}>{sub}</text>
      </g>
    )
    return (
      <figure className="fig">
        <svg viewBox="0 0 680 160" className="plot">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
            </marker>
          </defs>
          {box(0, 'Examples', 'features + answers')}
          {box(175, 'Model', 'adjustable knobs', true)}
          {box(350, 'Predictions', 'model’s guesses')}
          {box(525, 'Loss', 'how wrong?')}
          {[150, 325, 500].map((x) => <line key={x} x1={x + 2} x2={x + 22} y1={55} y2={55} stroke="var(--muted)" strokeWidth={2} markerEnd="url(#arr)" />)}
          <path d="M600,92 C600,145 250,145 250,94" fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#arr)" />
          <text x={425} y={150} textAnchor="middle" style={{ fontSize: 12, fill: 'var(--accent)', fontWeight: 700 }}>adjust the knobs to reduce the loss — repeat</text>
        </svg>
        <figcaption>The learning loop every supervised algorithm follows.</figcaption>
      </figure>
    )
  }
  return null
}
