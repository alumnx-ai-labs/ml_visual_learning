import type { Meta, RunResponse } from './types'

export async function getMeta(): Promise<Meta> {
  const r = await fetch('/api/meta')
  if (!r.ok) throw new Error('Could not reach the backend (is it running on port 8000?)')
  return r.json()
}

export async function runModel(body: object, signal?: AbortSignal): Promise<RunResponse> {
  const r = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!r.ok) throw new Error((await r.json().catch(() => ({ detail: r.statusText }))).detail)
  return r.json()
}
