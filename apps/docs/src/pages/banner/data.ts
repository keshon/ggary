import type { StatusTone } from '@ggary/core'

/** A banner per tone, each saying what that tone is for. */
export const toned: { tone: StatusTone; title: string; text: string }[] = [
  { tone: 'neutral', title: 'Invoices moved', text: 'They are under Settings → Billing now.' },
  { tone: 'running', title: 'Migrating the database', text: 'Writes are paused for about 5 minutes.' },
  { tone: 'ok', title: 'Deploy finished', text: 'v2.4 is live in every region.' },
  { tone: 'warn', title: 'Disk almost full', text: 'Old snapshots will be pruned tonight.' },
  { tone: 'error', title: 'Build failed', text: '3 tests failed on main.' },
]
