import type { Dict, Normalizer } from '../../types'
import type { StatusTone } from '../../utils/tone'
import { lanesAnatomy as anatomy } from './lanes.anatomy'
import type { Lane, LaneSpan, LanesProps, LanesWords } from './lanes.types'

export const LANES_WORDS: Required<LanesWords> = {
  span: (label, from, to, outcome) => `${label}, ${from} to ${to}, ${outcome}`,
  separator: '; ',
  labelSeparator: ': ',
  time: (value) => `${value} s`,
  idle: 'nothing yet',
  neutral: 'done',
  running: 'running',
  ok: 'succeeded',
  warn: 'with warnings',
  error: 'failed',
}

/** The window every lane is measured against: given, or what the work spans. */
export function lanesWindow(lanes: Lane[], start?: number, end?: number): { start: number; end: number } {
  const spans = lanes.flatMap((lane) => lane.spans).filter((span) => Number.isFinite(span.start) && Number.isFinite(span.end))
  const first = start ?? (spans.length ? Math.min(...spans.map((span) => Math.min(span.start, span.end))) : 0)
  const last = end ?? (spans.length ? Math.max(...spans.map((span) => Math.max(span.start, span.end))) : first)
  // A run of no duration still has to divide by something.
  return { start: first, end: last > first ? last : first + 1 }
}

const clamp = (value: number, low: number, high: number) => (value < low ? low : value > high ? high : value)
/** Four places: enough for a second inside a day, and short enough to read in the DOM. */
const round = (value: number) => Math.round(value * 10_000) / 10_000

/**
 * Several workers on ONE axis of time: a lane each, a segment for every
 * stretch of work, placed by when it began and how long it took. It answers
 * what neither a queue nor a log answers — **what ran at the same time, and
 * what waited for what.**
 *
 * It is not a Gantt at a smaller scale, and the difference is not the unit.
 * The Gantt is a treegrid: a column of task names beside the chart, days as
 * its atom, dependency arrows, groups that close, and bars that are dragged to
 * new dates through a machine that holds a draft and announces every change.
 * Lanes has none of that and wants none of it: the work is over or it is
 * happening, nothing here can be moved, and a worker's name is a label rather
 * than a column. What is left is arithmetic over one window — which is why
 * there is no machine.
 *
 * The geometry is two numbers per segment, `--gg-lane-start` and
 * `--gg-lane-span`, as percentages of the window. The kit hands geometry to
 * CSS through custom properties rather than through inline `inset-inline-start`
 * and `inline-size`, as the Gantt's days and a meter's fill do: the value is
 * then one name the theme can read, and the direction of the axis stays the
 * theme's to mirror in RTL.
 *
 * A segment is a rectangle and is spoken by nothing, so every lane carries its
 * work in words — the stretch, its bounds and its outcome — and the outcome is
 * a word as well as a colour.
 *
 * On a narrow screen lanes are unreadable; the fallback view is a table of the
 * start, the end and the duration, and that is the application's to choose.
 */
export function connect<T = Dict>(props: LanesProps, normalize: Normalizer<T>, words: LanesWords = {}) {
  const { lanes, label, locale } = props
  const w = { ...LANES_WORDS, ...words }
  const window = lanesWindow(lanes, props.start, props.end)
  const total = window.end - window.start
  const format = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const at = (ms: number) => w.time(format.format((clamp(ms, window.start, window.end) - window.start) / 1000))
  const outcome = (tone: StatusTone = 'neutral') => w[tone]

  const place = (span: LaneSpan) => {
    const from = clamp(Math.min(span.start, span.end), window.start, window.end)
    const to = clamp(Math.max(span.start, span.end), window.start, window.end)
    return { start: round(((from - window.start) / total) * 100), span: round(((to - from) / total) * 100) }
  }

  return {
    window,
    lanes: lanes.map((lane) => {
      const spans = lane.spans.filter((span) => Number.isFinite(span.start) && Number.isFinite(span.end))
      const reading = spans.length
        ? spans.map((span) => w.span(span.label, at(span.start), at(span.end), outcome(span.tone))).join(w.separator)
        : w.idle
      return {
        lane,
        key: lane.id,
        /** The lane's work in words, said and not shown. */
        text: `${w.labelSeparator}${reading}`,
        laneProps: normalize({ ...anatomy.attrs('lane'), 'data-lane': lane.id }),
        labelProps: normalize({ ...anatomy.attrs('label'), title: lane.label }),
        trackProps: normalize({ ...anatomy.attrs('track') }),
        spans: spans.map((span, index) => {
          const box = place(span)
          return {
            span,
            key: span.id ?? String(index),
            spanProps: normalize({
              ...anatomy.attrs('span'),
              'data-tone': span.tone,
              // A rectangle with no name says nothing to a pointer either.
              title: `${span.label} — ${at(span.start)} → ${at(span.end)}`,
              style: { '--gg-lane-start': box.start, '--gg-lane-span': box.span },
            }),
          }
        }),
      }
    }),

    rootProps: normalize({ ...anatomy.attrs('root'), 'aria-label': label }),
    laneTextProps: normalize({ ...anatomy.attrs('lane-text') }),
  }
}

export type LanesApi<T = Dict> = ReturnType<typeof connect<T>>
