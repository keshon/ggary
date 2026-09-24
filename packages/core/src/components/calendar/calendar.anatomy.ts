import { createAnatomy } from '../../types'

/** A month: its header (the title between the previous and next buttons) over a grid of weekday heads and weeks of days. */
export const calendarAnatomy = createAnatomy('calendar', [
  'root',
  'months',
  'month',
  'header',
  'title',
  'prev',
  'next',
  'nav-icon',
  'grid',
  'head',
  'body',
  'head-row',
  'weekday',
  'week',
  'day',
] as const)
export type CalendarPart = (typeof calendarAnatomy.parts)[number]
