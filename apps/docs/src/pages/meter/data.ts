import type { StatusTone } from '@ggary/core'

/** One quantity against its ceiling, per tone: what that tone would mean for it. */
export const toned: { tone: StatusTone; label: string; value: number; max: number }[] = [
  { tone: 'neutral', label: 'Seats taken', value: 12, max: 20 },
  { tone: 'running', label: 'Agents busy', value: 7, max: 12 },
  { tone: 'ok', label: 'Tests passing', value: 248, max: 251 },
  { tone: 'warn', label: 'Disk on the runner', value: 237, max: 240 },
  { tone: 'error', label: 'Error budget spent', value: 96, max: 100 },
]
