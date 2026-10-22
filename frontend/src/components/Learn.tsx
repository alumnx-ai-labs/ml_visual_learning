import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { LESSONS, PRIMER } from '../content'
import { findTerm, type Term } from '../content/terms'
import { Rich } from './Rich'
import type { Chapter, Example, FlowStep, Quiz } from '../content/types'
import type { AlgoSpec } from '../types'
import { Figure } from './Figures'
import { Tex } from './ui'

type Tab = 'data' | 'watch' | 'results'

/** Every glossary term a chapter mentions in bold, in order of first appearance. */
function chapterTerms(ch: Chapter): Term[] {
  const texts = [...ch.story, ch.plain ?? '', ...(ch.tech ?? []), ...(ch.example?.after ?? []), ch.example?.intro ?? '',
    ...(ch.flow ?? []).flatMap((f) => [f.what])]
  const found = new Map<string, Term>()
  for (const t of texts) for (const m of t.matchAll(/\*\*([^*]+)\*\*/g)) {
    const term = findTerm(m[1])
    if (term && !found.has(term.name)) found.set(term.name, term)
  }
  return [...found.values()]
}

function FlowView({ steps, goChapter }: { steps: FlowStep[]; goChapter: (title: string) => void }) {
  const out: ReactNode[] = []
  let loop: ReactNode[] | null = null
  steps.forEach((s, i) => {
    const node = (
      <div className="flow-step" key={i}>
        <div className="flow-n">{i + 1}</div>
        <div className="flow-body">
          <div className="flow-title">{s.step}</div>
          <div className="flow-what"><Rich text={s.what} /></div>
          {s.example && <div className="flow-ex"><span>Example</span>{s.example}</div>}
          {s.see && <button className="flow-see" onClick={() => goChapter(s.see!)}>Explained in: {s.see} →</button>}
        </div>
      </div>
    )
    if (s.loopStart) loop = []
    if (loop) loop.push(node)
    else out.push(node)
    if (s.loopEnd && loop) {
      out.push(
        <div className="flow-loop" key={'loop' + i}>
          <div className="flow-loop-label">Repeat</div>
          {loop}
          <div className="flow-loop-note"><Rich text={s.loopEnd} /></div>
        </div>,
      )
      loop = null
    }
  })
  return <div className="flow">{out}</div>
}

function KeyTerms({ ch }: { ch: Chapter }) {
  const terms = chapterTerms(ch)
  if (!terms.length) return null
  return (
    <div className="keyterms">
      <div className="box-title">Key terms in this chapter</div>
      <dl>
        {terms.map((t) => (
          <div key={t.name} className="keyterm">
            <dt>{t.name}</dt>
            <dd>
              {t.plain}
              <span className="keyterm-ex"><b>Example:</b> {t.example}</span>
              <span className="keyterm-tech"><b>Technically:</b> {t.tech}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const Blocks = ({ items }: { items: string[] }) => (
  <>{items.map((t, i) => (t.startsWith('$$') ? <Rich key={i} text={t} /> : <p key={i}><Rich text={t} /></p>))}</>
)

function Box({ kind, title, children }: { kind: 'plain' | 'tech' | 'example' | 'quiz' | 'try'; title: string; children: ReactNode }) {
  return (
    <div className={'box box-' + kind}>
      <div className="box-title">{title}</div>
      {children}
    </div>
  )
}

function ExampleBox({ ex }: { ex: Example }) {
  return (
    <Box kind="example" title={'Worked example — ' + ex.title}>
      {ex.intro && <p><Rich text={ex.intro} /></p>}
      {ex.table && (
        <div className="table-wrap">
          <table className="ex">
            <thead><tr>{ex.table.head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>{ex.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {ex.code && <pre className="flow">{ex.code}</pre>}
      {ex.after && <Blocks items={ex.after} />}
    </Box>
  )
}

function QuizBox({ quiz }: { quiz: Quiz }) {
  const [pick, setPick] = useState<number | null>(null)
  return (
    <Box kind="quiz" title="Check your understanding">
      <p className="quiz-q"><Rich text={quiz.q} /></p>
      <div className="quiz-opts">
        {quiz.options.map((o, i) => (
          <button key={i} className={'opt' + (pick === null ? '' : i === quiz.answer ? ' right' : i === pick ? ' wrong' : ' dim')} onClick={() => setPick(i)}>
            <span className="opt-letter">{String.fromCharCode(65 + i)}</span>{o}
          </button>
        ))}
      </div>
      {pick !== null && (
        <p className={'quiz-why ' + (pick === quiz.answer ? 'ok' : 'no')}>
          <b>{pick === quiz.answer ? 'Correct.' : 'Not quite.'}</b> <Rich text={quiz.why} />
        </p>
      )}
    </Box>
  )
}

export function ChapterView({ ch, n, goTo, goChapter = () => {} }: { ch: Chapter; n: number; goTo: (t: Tab) => void; goChapter?: (title: string) => void }) {
  return (
    <article className="chapter" key={ch.title}>
      <div className="chapter-kicker">Chapter {n}</div>
      <h2 className="chapter-title">{ch.title}</h2>
      <div className="story"><Blocks items={ch.story} /></div>
      {ch.flow && <FlowView steps={ch.flow} goChapter={goChapter} />}
      {ch.figure && <Figure kind={ch.figure} />}
      {ch.plain && <Box kind="plain" title="In plain words"><p><Rich text={ch.plain} /></p></Box>}
      {ch.example && <ExampleBox ex={ch.example} />}
      {ch.tech && (
        <details className="box box-tech">
          <summary className="box-title">Under the hood (technical)</summary>
          <Blocks items={ch.tech} />
        </details>
      )}
      {ch.quiz && <QuizBox key={ch.title} quiz={ch.quiz} />}
      {ch.tryIt && (
        <Box kind="try" title="Try it yourself">
          <p><Rich text={ch.tryIt.text} /></p>
          {ch.tryIt.tab && <button className="btn primary" onClick={() => goTo(ch.tryIt!.tab!)}>Open the {ch.tryIt.tab === 'watch' ? 'Watch it learn' : ch.tryIt.tab === 'data' ? 'Data' : 'Results'} tab</button>}
        </Box>
      )}
      <KeyTerms ch={ch} />
    </article>
  )
}

export function Learn({ algo, goTo }: { algo: AlgoSpec; goTo: (t: Tab) => void }) {
  const L = LESSONS[algo.id]
  const chapters = L ? [PRIMER, ...L.chapters] : []
  const total = chapters.length + 1 // + cheat sheet
  const [idx, setIdx] = useState(0)
  const [seen, setSeen] = useState<Set<number>>(new Set([0]))

  useEffect(() => { setIdx(0); setSeen(new Set([0])) }, [algo.id])
  const go = (i: number) => {
    setIdx(i)
    setSeen((s) => new Set(s).add(i))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  if (!L) return null
  const isCheat = idx === chapters.length

  return (
    <div className="learn">
      <section className="hero">
        <div className="hero-eyebrow">{algo.category === 'supervised' ? 'Supervised learning' : 'Unsupervised learning'} · {algo.tasks.join(' & ')}</div>
        <h1>{algo.name}</h1>
        <p>{L.tagline}</p>
        <div className="hero-cards">
          <div className="hero-card"><div className="hero-card-label">Problem statement</div><Rich text={L.problem} /></div>
          <div className="hero-card"><div className="hero-card-label">Goal</div><Rich text={L.goal} /></div>
        </div>
        <div className="progress"><div style={{ width: `${(seen.size / total) * 100}%` }} /></div>
        <div className="small" style={{ opacity: 0.85 }}>{seen.size} of {total} sections visited</div>
      </section>

      <div className="learn-grid">
        <nav className="toc">
          {chapters.map((c, i) => (
            <button key={i} className={'toc-item' + (i === idx ? ' on' : '') + (seen.has(i) ? ' seen' : '')} onClick={() => go(i)}>
              <span className="toc-n">{i === 0 ? '0' : i}</span><span>{c.title}</span>
            </button>
          ))}
          <button className={'toc-item' + (isCheat ? ' on' : '') + (seen.has(chapters.length) ? ' seen' : '')} onClick={() => go(chapters.length)}>
            <span className="toc-n">{chapters.length}</span><span>Cheat sheet</span>
          </button>
        </nav>

        <div>
          {!isCheat ? <ChapterView ch={chapters[idx]} n={idx} goTo={goTo} goChapter={(t) => { const i = chapters.findIndex((c) => c.title === t); if (i >= 0) go(i) }} /> : <CheatSheet algoId={algo.id} algo={algo} />}
          <div className="pager">
            <button className="btn" disabled={idx === 0} onClick={() => go(idx - 1)}>← Previous</button>
            <span className="small muted">{idx + 1} / {total}</span>
            {idx < total - 1
              ? <button className="btn primary" onClick={() => go(idx + 1)}>Next: {idx + 1 < chapters.length ? chapters[idx + 1].title : 'Cheat sheet'} →</button>
              : <button className="btn primary" onClick={() => goTo('watch')}>Now watch it learn →</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CheatSheet({ algoId, algo }: { algoId: string; algo: AlgoSpec }) {
  const C = LESSONS[algoId].cheat
  return (
    <article className="chapter">
      <div className="chapter-kicker">Summary</div>
      <h2 className="chapter-title">Cheat sheet</h2>
      <h3>Key formulas</h3>
      <div className="formula-grid">
        {C.formulas.map((f) => <div key={f.name} className="formula-card"><div className="small muted">{f.name}</div><Tex block>{f.tex}</Tex></div>)}
      </div>
      <h3>Symbols</h3>
      <div className="sym">{C.symbols.map((s) => <Fragment key={s.sym}><b>{s.sym}</b><span>{s.meaning}</span></Fragment>)}</div>
      <div className="grid2" style={{ marginTop: '1.2rem' }}>
        <div className="box box-plain"><div className="box-title">Use it when</div><ul>{C.use.map((u) => <li key={u}>{u}</li>)}</ul></div>
        <div className="box box-quiz"><div className="box-title">Avoid it when</div><ul>{C.avoid.map((u) => <li key={u}>{u}</li>)}</ul></div>
      </div>
      <div className="box box-tech"><div className="box-title">Common pitfalls</div><ul>{C.pitfalls.map((u) => <li key={u}>{u}</li>)}</ul></div>
      <h3>The knobs in the left panel</h3>
      <ul>{algo.params.map((p) => <li key={p.key}><b>{p.label}.</b> {p.help}</li>)}</ul>
      <h3>Glossary</h3>
      <div className="sym">{C.glossary.map((g) => <Fragment key={g.term}><b>{g.term}</b><span>{g.def}</span></Fragment>)}</div>
    </article>
  )
}
