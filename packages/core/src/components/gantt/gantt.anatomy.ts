import { createAnatomy } from '../../types'

/**
 * A Gantt chart: tasks as bars on a time scale, a list of their names beside
 * them.
 *
 * Everything here is counted in days — where a bar starts, how many days it
 * spans, how many the chart shows, where today is — and handed to CSS as
 * custom properties. The theme says how wide a day is at each scale, so the
 * same chart is a fortnight on a laptop or a year at the month scale without
 * the core knowing a pixel.
 *
 * To a screen reader it is a grid: a row per task, its name the row's header,
 * its schedule a cell that says the dates in words ("18 Sep – 25 Sep 2026,
 * 8 days, 40% done") while the bar shows them to the eye. One tab stop; Up
 * and Down walk the tasks, Home and End, PageUp and PageDown; Enter opens one.
 *
 * Tasks may be grouped under headings: a group's row shows a summary bar from
 * its first task's start to its last one's end, and closes to hide its tasks.
 * With groups the grid is a treegrid.
 */

export const ganttAnatomy = createAnatomy('gantt', [
  'root',
  'header',
  'corner',
  'scale',
  'scale-row',
  'scale-cell',
  'body',
  'row',
  'title',
  'schedule',
  'schedule-text',
  'bar',
  'bar-progress',
  'bar-label',
  'bar-start',
  'bar-end',
  'milestone',
  'group-toggle',
  'summary',
  'summary-progress',
  'links',
  'link',
  'link-segment',
  'link-head',
  'live',
  'instructions',
  'today',
  'empty',
] as const)
export type GanttPart = (typeof ganttAnatomy.parts)[number]
