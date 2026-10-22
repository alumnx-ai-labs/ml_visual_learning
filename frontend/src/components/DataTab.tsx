import { useState } from 'react'
import type { RunResponse } from '../types'
import { axes, className, Points, pointLegend } from './DataPoints'
import { Plot } from './Plot'
import { Callout, Card, fmt, Legend } from './ui'

export function DataTab({ run }: { run: RunResponse }) {
  const { data, task } = run
  const [sel, setSel] = useState<number | null>(0)
  const a = axes(run)
  const reg = task === 'regression'
  const i = sel ?? 0
  const row = data.X[i]

  return (
    <div className="stack">
      <Card title={`Where the data comes from: ${data.dataset}`}>
        <p>{data.origin}</p>
        <p className="small muted">
          Every row is <b>one data point</b>. The <b>feature{data.feature_names.length > 1 ? 's' : ''}</b> ({data.feature_names.join(', ')})
          {' '}are the inputs the model sees; the <b>target</b> ({data.target_name}) is the answer it must learn to predict.
          {' '}We hold back 25% of the rows as a <b>test set</b>: the model never learns from them, so they show how it behaves on new data.
        </p>
        <div className="kpis">
          <div className="kpi"><div className="l">Total points</div><div className="v">{data.X.length}</div></div>
          <div className="kpi"><div className="l">Training</div><div className="v">{data.n_train}</div></div>
          <div className="kpi"><div className="l">Test (hidden)</div><div className="v">{data.n_test}</div></div>
        </div>
      </Card>

      <div className="grid2">
        <Card title="Every point on a chart">
          <Plot xDomain={a.xDomain} yDomain={a.yDomain} xLabel={a.xLabel} yLabel={a.yLabel} height={380}>
            {(ctx) => <Points run={run} ctx={ctx} selected={sel} onSelect={setSel} />}
          </Plot>
          <Legend items={pointLegend(run)} />
          <p className="small muted" style={{ marginTop: '.5rem' }}>Click a point (or a table row) to link the two.</p>
        </Card>

        <Card title="…and as a table">
          <div className="scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  {data.feature_names.map((f) => <th key={f}>{f}</th>)}
                  <th>{data.target_name}</th>
                  <th>set</th>
                </tr>
              </thead>
              <tbody>
                {data.X.map((r, k) => (
                  <tr key={k} className={sel === k ? 'sel' : ''} onClick={() => setSel(k)}>
                    <td>{k}</td>
                    {r.map((v, j) => <td key={j}>{fmt(v, 2)}</td>)}
                    <td>{reg ? fmt(data.y[k], 2) : className(run, data.y[k])}</td>
                    <td>{data.is_test[k] ? <span className="badge test">test</span> : <span className="badge">train</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Callout>
        <b>Reading row #{i}:</b> {data.feature_names.map((f, j) => `${f} = ${fmt(row[j], 2)}`).join(', ')} → {data.target_name} ={' '}
        {reg ? fmt(data.y[i], 2) : className(run, data.y[i])}. It is a <b>{data.is_test[i] ? 'test' : 'training'}</b> point, shown on the chart as a {data.is_test[i] ? 'hollow ring' : 'filled dot'}.
      </Callout>
    </div>
  )
}
