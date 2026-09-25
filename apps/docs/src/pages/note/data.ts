import type { StatusTone } from '@ggary/core'

/** A note per tone: an aside, with the tone's glyph beside it. */
export const toned: { tone: StatusTone; text: string }[] = [
  { tone: 'neutral', text: 'Imports run at night, when the board is quiet.' },
  { tone: 'running', text: 'Reindexing: search may miss the newest leads for a minute.' },
  { tone: 'ok', text: 'All 120 leads were imported.' },
  { tone: 'warn', text: 'runner-02 has not reported for 5 minutes.' },
  { tone: 'error', text: 'Deleting a project cannot be undone.' },
]
