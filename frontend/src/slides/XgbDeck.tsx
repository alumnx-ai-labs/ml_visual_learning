import { axes, Points } from '../components/DataPoints'
import { extent, Plot } from '../components/Plot'
import { fmt, Legend } from '../components/ui'
import type { RunResponse } from '../types'
import { ChartLabel, Deck, Recap, testOf, trainOf, useRuns, type SlideDef } from './common'

interface Round { k: number; train_pred: number[]; grid: number[]; train_loss: number; test_loss: number }

export function XgbDeck() {
  const { runs, err } = useRuns([{ algo: 'xgboost', dataset: 'houses', n: 150, params: { n_estimators: 25, learning_rate: 0.3, max_depth: 2 } }])
  if (err) return <div className="callout warn">{err}</div>
  if (!runs) return <p className="muted">Preparing the lesson…</p>
  return <Deck name="XGBoost" slides={build(runs[0])} />
}

export function build(run: RunResponse): SlideDef[] {
  const R = run.result
  const a = axes(run)
  const { data } = run
  const tr = trainOf(run)
  const te = testOf(run)
  const rounds: Round[] = R.rounds
  const xs: number[] = R.grid.xs
  const lr: number = R.lr
  const last = rounds[rounds.length - 1]
  const best = rounds.reduce((bi, r, i) => (r.test_loss < rounds[bi].test_loss ? i : bi), 0)
  const resid0 = tr.map((i, j) => data.y[i] - rounds[0].train_pred[j])
  const tree1 = xs.map((_, i) => (rounds[1].grid[i] - rounds[0].grid[i]) / lr)
  const meanAbs = (r: Round) => tr.reduce((s, i, j) => s + Math.abs(data.y[i] - r.train_pred[j]), 0) / tr.length

  const board = (r: Round, opts: { prev?: Round; resid?: boolean; label?: string; test?: boolean; noLine?: boolean } = {}) => (
    <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel="house size (sq ft)" yLabel="price (lakhs)" height={400}>
      {(c) => (
        <>
          {opts.resid && tr.map((i, j) => (
            <line key={i} x1={c.sx(a.px[i])} x2={c.sx(a.px[i])} y1={c.sy(data.y[i])} y2={c.sy(r.train_pred[j])} stroke="var(--bad)" strokeWidth={1.3} strokeDasharray="3 2" opacity={0.7} />
          ))}
          <Points run={run} ctx={c} show={opts.test ? 'all' : 'train'} radius={4.5} />
          {opts.prev && <polyline fill="none" stroke="var(--muted)" strokeWidth={2.5} strokeDasharray="6 4" points={xs.map((x, i) => `${c.sx(x)},${c.sy(opts.prev!.grid[i])}`).join(' ')} />}
          {!opts.noLine && <polyline fill="none" stroke="var(--accent)" strokeWidth={3.5} points={xs.map((x, i) => `${c.sx(x)},${c.sy(r.grid[i])}`).join(' ')} />}
          {opts.label && <ChartLabel>{opts.label}</ChartLabel>}
        </>
      )}
    </Plot>
  )

  return [
    {
      title: 'What is this house worth?',
      text: [
        'Each dot is a house that was sold: its size (left to right) and its price in lakhs (bottom to top).',
        'Price rises fast for small homes, levels off, then jumps for very big ones. That is not a straight line, so we want a model that can bend. **XGBoost** is one of the most accurate ways to do this.',
      ],
      visual: () => board(rounds[0], { noLine: true }),
    },
    {
      title: 'Start with the simplest guess',
      text: [
        `XGBoost starts by guessing the average price for every house: **${fmt(R.base, 0)} lakhs**. That is the flat purple line.`,
        `Each red line is a **residual**: how far off that guess is for one house. On average they are ${fmt(meanAbs(rounds[0]), 0)} lakhs off.`,
      ],
      visual: () => board(rounds[0], { resid: true, label: `guess: ${fmt(R.base, 0)} for every house` }),
    },
    {
      title: 'A tiny tree learns the mistakes',
      text: [
        'Now a very small **decision tree** is trained. It does not predict prices: it predicts these **residuals**, the mistakes.',
        'The red dots are the mistakes (above zero = the guess was too low). The green steps are the tree\'s answer, roughly "small houses: lower the guess, big houses: raise it". A small simple tree like this is a **weak learner**.',
      ],
      visual: () => (
        <Plot xDomain={a.xDomain} yDomain={extent(resid0)} xLabel="house size (sq ft)" yLabel="mistake (real − guess)" height={400}>
          {(c) => (
            <>
              <line x1={0} x2={c.w} y1={c.sy(0)} y2={c.sy(0)} stroke="var(--muted)" strokeDasharray="4 4" />
              {tr.map((i, j) => <circle key={i} cx={c.sx(a.px[i])} cy={c.sy(resid0[j])} r={4.5} fill="var(--bad)" opacity={0.75} />)}
              <polyline fill="none" stroke="var(--good)" strokeWidth={4} points={xs.map((x, i) => `${c.sx(x)},${c.sy(tree1[i])}`).join(' ')} />
              <ChartLabel>tree 1 learns the mistakes</ChartLabel>
            </>
          )}
        </Plot>
      ),
    },
    {
      title: 'Add only a bit of the fix',
      text: [
        `We add only ${Math.round(lr * 100)}% of the tree's answer to the guess. That fraction is the **learning rate**: careful small steps stop one tree from overreacting.`,
        `The grey dashed line was the old guess; the purple line is the new one. It already bends towards the data, and the average mistake drops from ${fmt(meanAbs(rounds[0]), 0)} to ${fmt(meanAbs(rounds[1]), 0)} lakhs.`,
      ],
      visual: () => board(rounds[1], { prev: rounds[0], resid: true, label: 'after tree 1' }),
    },
    {
      title: 'Repeat: each tree fixes what is left',
      text: [
        'Tree 2 learns the mistakes that are still left after tree 1, tree 3 the mistakes left after tree 2, and so on. Each one fixes a bit more.',
        'This is **boosting**: a team built one member at a time, where every new member focuses on the previous members\' errors. Watch the line wrap around the data.',
      ],
      frames: rounds.length,
      fps: 3,
      visual: (t) => board(rounds[t], { resid: true, label: `${t} tree${t === 1 ? '' : 's'}: average mistake ${fmt(meanAbs(rounds[t]), 1)} lakhs` }),
    },
    {
      title: 'Watch the error, and know when to stop',
      text: [
        'Blue: error on houses the model learns from. Orange: error on hidden houses (the **test set**). Both drop quickly, then level off.',
        `More trees keep pushing blue down, but orange stops improving. Here the best test result is at tree ${best}. If orange rises, extra trees are memorising noise (**overfitting**); stopping at the best point is **early stopping**.`,
      ],
      frames: rounds.length,
      fps: 5,
      visual: (t) => {
        const maxL = Math.max(...rounds.map((r) => Math.max(r.train_loss, r.test_loss)))
        return (
          <>
            <Plot xDomain={[0, rounds.length - 1]} yDomain={[0, maxL * 1.05]} xLabel="number of trees" yLabel="typical mistake (RMSE, lakhs)" height={400}>
              {(c) => (
                <>
                  <polyline fill="none" stroke="var(--c0)" strokeWidth={3} points={rounds.slice(0, t + 1).map((r) => `${c.sx(r.k)},${c.sy(r.train_loss)}`).join(' ')} />
                  <polyline fill="none" stroke="var(--c1)" strokeWidth={3} points={rounds.slice(0, t + 1).map((r) => `${c.sx(r.k)},${c.sy(r.test_loss)}`).join(' ')} />
                  {t >= best && <line x1={c.sx(best)} x2={c.sx(best)} y1={0} y2={c.h} stroke="var(--good)" strokeWidth={2} strokeDasharray="5 4" />}
                  <ChartLabel>{t} trees · test error {fmt(rounds[t].test_loss, 1)}</ChartLabel>
                </>
              )}
            </Plot>
            <Legend items={[{ color: 'var(--c0)', label: 'houses it learns from' }, { color: 'var(--c1)', label: 'hidden houses' }, { color: 'var(--good)', label: 'best stopping point' }]} />
          </>
        )
      },
    },
    {
      title: 'The result',
      text: [
        `After ${last.k} trees the final prediction is: the average + ${Math.round(lr * 100)}% of tree 1 + ${Math.round(lr * 100)}% of tree 2 + … all added together.`,
        `On the ${te.length} hidden houses (hollow dots) its typical mistake is **${fmt(R.test_metrics.rmse, 1)} lakhs** (**RMSE**), and **R²** is ${fmt(R.test_metrics.r2, 2)}: it explains about ${Math.round(R.test_metrics.r2 * 100)}% of the price differences.`,
      ],
      visual: () => board(last, { test: true, label: `R² on hidden houses: ${fmt(R.test_metrics.r2, 2)}` }),
    },
    {
      title: 'Recap',
      text: [
        'XGBoost in one sentence: start with a simple guess, then add small trees one by one, each one trained on the mistakes still left.',
        'Random forest builds trees independently and averages them; boosting builds them in a chain where each fixes the last. Boosting is usually the more accurate of the two.',
      ],
      visual: () => (
        <Recap
          loop={[2, 4]}
          steps={['Collect examples: size and price', 'Guess the average for everyone', 'Compute the mistakes left (**residuals**)', 'Train a small tree on those mistakes', 'Add a fraction of it (**learning rate**)', 'Stop when hidden-house error stops improving (**early stopping**)']}
        />
      ),
    },
  ]
}
