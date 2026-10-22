import { Fragment, type ReactNode } from 'react'
import { findTerm, type Term } from '../content/terms'
import { Tex } from './ui'

/** Renders **bold** and $inline math$ inside a text block; a block starting with $$ is a display formula. */
export function Rich({ text }: { text: string }) {
  if (text.startsWith('$$')) return <Tex block>{text.slice(2)}</Tex>
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$]+\$)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? <BoldOrTerm key={i} text={p.slice(2, -2)} />
          : p.startsWith('$') && p.length > 1 ? <Tex key={i}>{p.slice(1, -1)}</Tex>
            : p.split(/(\*[^*]+\*)/g).map((q, j) => (q.startsWith('*') && q.length > 2 ? <em key={i + '-' + j}>{q.slice(1, -1)}</em> : <Fragment key={i + '-' + j}>{q}</Fragment>)),
      )}
    </>
  )
}

export function TermTip({ term, children }: { term: Term; children: ReactNode }) {
  return (
    <span className="term" tabIndex={0}>
      {children}
      <span className="term-pop" role="tooltip">
        <span className="term-name">{term.name}</span>
        <span className="term-plain">{term.plain}</span>
        <span className="term-ex"><b>Example:</b> {term.example}</span>
        <span className="term-tech"><b>Technically:</b> {term.tech}</span>
      </span>
    </span>
  )
}

function BoldOrTerm({ text }: { text: string }) {
  const t = findTerm(text)
  return t ? <TermTip term={t}><strong>{text}</strong></TermTip> : <strong>{text}</strong>
}

