import { Rich } from './Rich'

/** "How to read this page": numbered orientation shown at the top of every Watch view. */
export function Guide({ title, intro, steps }: { title: string; intro: string; steps: string[] }) {
  return (
    <section className="guide">
      <div className="guide-label">How to read this page</div>
      <h3>{title}</h3>
      <p><Rich text={intro} /></p>
      <ol>{steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>
    </section>
  )
}

/** Live narration for the current animation frame. */
export function Narration({ stage, title, lines, tone }: { stage: string; title: string; lines: string[]; tone?: 'warn' | 'good' }) {
  return (
    <section className={'narration' + (tone ? ' ' + tone : '')} aria-live="polite">
      <div className="narration-stage">{stage}</div>
      <div className="narration-title"><Rich text={title} /></div>
      {lines.map((l, i) => <p key={i}><Rich text={l} /></p>)}
    </section>
  )
}

/** "Read it / Look for" notes under a chart. */
export function ChartNote({ read, look }: { read: string; look?: string }) {
  return (
    <div className="chart-note">
      <p><b>Read it:</b> <Rich text={read} /></p>
      {look && <p><b>Look for:</b> <Rich text={look} /></p>}
    </div>
  )
}
