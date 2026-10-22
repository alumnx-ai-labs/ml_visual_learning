export type Task = 'regression' | 'classification' | 'unsupervised'

export interface ParamSpec {
  key: string
  label: string
  help: string
  type?: 'select'
  min?: number
  max?: number
  step?: number
  default: number | string
  options?: { value: string; label: string }[]
}

export interface AlgoSpec {
  id: string
  name: string
  category: 'supervised' | 'unsupervised'
  tasks: Task[]
  needs_2d: boolean
  params: ParamSpec[]
}

export interface DatasetInfo {
  key: string
  name: string
  tasks: Task[]
  dims: number
  origin: string
  fixed_n: boolean
  noise: { label: string; min: number; max: number; step: number; default: number } | null
}

export interface Meta {
  algorithms: AlgoSpec[]
  datasets: DatasetInfo[]
}

export interface DataPayload {
  X: number[][]
  y: number[]
  is_test: boolean[]
  feature_names: string[]
  target_name: string
  classes: string[] | null
  dataset: string
  origin: string
  noise: number
  n_train: number
  n_test: number
}

// The shape differs per algorithm, so the algorithm-specific visuals narrow it themselves.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Result = any

export interface RunResponse {
  task: Task
  params: Record<string, number | string>
  data: DataPayload
  result: Result
}

export interface VizProps {
  run: RunResponse
}
