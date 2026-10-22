/**
 * Lesson content model.
 * Text blocks support **bold** and inline math $...$. A block that starts with "$$" is a display formula.
 */
export interface Example {
  title: string
  intro?: string
  table?: { head: string[]; rows: (string | number)[][] }
  code?: string
  after?: string[]
}

export interface Quiz {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface FlowStep {
  step: string
  what: string
  /** the running example's numbers at this step */
  example?: string
  /** title of the chapter that explains this step */
  see?: string
  /** marks the start/end of the repeating part of the algorithm */
  loopStart?: boolean
  loopEnd?: string
}

export interface Chapter {
  title: string
  flow?: FlowStep[]
  /** the narrative — what happens next in the story */
  story: string[]
  /** layman version ("explain it to a friend") */
  plain?: string
  /** technical depth, formulas */
  tech?: string[]
  example?: Example
  figure?: 'toyLine' | 'sigmoid' | 'boosting' | 'mlLoop' | 'bootstrap'
  quiz?: Quiz
  tryIt?: { text: string; tab?: 'data' | 'watch' | 'results' }
}

export interface Lesson {
  tagline: string
  problem: string
  goal: string
  chapters: Chapter[]
  cheat: {
    formulas: { name: string; tex: string }[]
    symbols: { sym: string; meaning: string }[]
    use: string[]
    avoid: string[]
    pitfalls: string[]
    glossary: { term: string; def: string }[]
  }
}
