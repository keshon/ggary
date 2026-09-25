import type { StatusTone } from '@ggary/core'

/** A dot per tone, always beside the word that names the state. */
export const toned: { tone: StatusTone; word: string }[] = [
  { tone: 'neutral', word: 'Draft' },
  { tone: 'running', word: 'Running' },
  { tone: 'ok', word: 'Passed' },
  { tone: 'warn', word: 'Flaky' },
  { tone: 'error', word: 'Failed' },
]
