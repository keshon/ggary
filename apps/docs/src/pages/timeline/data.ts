import type { TimelineItem } from '@ggary/core/timeline'

/** One nightly run, newest first, with a tone on each step that has one. */
export const runEvents: TimelineItem[] = [
  { id: 'e4', title: 'Run finished with 3 failing tests', detail: '4 files changed', time: '2026-09-22T02:15:49', tone: 'warn' },
  { id: 'e3', title: 'Tests running', detail: '251 in 6 shards', time: '2026-09-22T02:14:52', tone: 'running' },
  { id: 'e2', title: 'Build succeeded', detail: 'bundle 7.4 MB', time: '2026-09-22T02:14:31', tone: 'ok' },
  { id: 'e1', title: 'Queued', time: '2026-09-22T02:14:07' },
]

/** A board's history: events with no state to report. */
export const boardEvents: TimelineItem[] = [
  { id: 'b3', title: 'Filter “Hot leads” saved', detail: 'by Anna Petrova', time: '2026-09-22T16:40:00' },
  { id: 'b2', title: 'Columns reordered', detail: 'by Mark Chen', time: '2026-09-22T11:05:00' },
  { id: 'b1', title: 'Board created', time: '2026-09-22T09:12:00' },
]

/** The same moments, told in words the app chose. */
export const dayEvents: TimelineItem[] = [
  { id: 'd3', title: 'Invoice paid', time: '2026-09-22T10:00:00', timeLabel: 'Today', tone: 'ok' },
  { id: 'd2', title: 'Reminder sent', time: '2026-09-21T09:00:00', timeLabel: 'Yesterday' },
  { id: 'd1', title: 'Invoice issued', time: '2026-09-15T09:00:00', timeLabel: 'Mon 15 Sep' },
]

/** A review, told by who did what: a rich body per item. */
export const reviewEvents: TimelineItem[] = [
  { id: 'Anna Petrova', title: 'Approved the budget change', time: '2026-09-22T14:20:00', tone: 'ok' },
  { id: 'Mark Chen', title: 'Asked for changes on the migration plan', time: '2026-09-22T11:02:00', tone: 'warn' },
  { id: 'Leila Haddad', title: 'Started reviewing', time: '2026-09-22T10:45:00', tone: 'running' },
]

export const withSeconds: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' }
