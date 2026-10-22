import { forest } from './forest'
import { linear } from './linear'
import { logistic } from './logistic'
import type { Lesson } from './types'
import { xgboost } from './xgboost'

export { PRIMER } from './primer'
export const LESSONS: Record<string, Lesson> = { linear, logistic, forest, xgboost }
