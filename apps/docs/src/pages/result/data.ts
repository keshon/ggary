import type { ResultTone } from '@ggary/core/result'

/** An outcome per tone, each a short title and one line of what it means. */
export const outcomes: { tone?: ResultTone; title: string; description: string }[] = [
  { title: 'Export queued', description: 'We will email you when it is ready.' },
  { tone: 'ok', title: 'Payment sent', description: '€420 to Acme GmbH.' },
  { tone: 'warn', title: 'Sent with warnings', description: '2 of 40 invoices were skipped.' },
  { tone: 'error', title: 'Payment failed', description: 'The card was declined.' },
]
