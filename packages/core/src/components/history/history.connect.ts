import type { Dict, Normalizer } from '../../types'
import { historyAnatomy as anatomy } from './history.anatomy'
import type { HistoryCounts, HistoryGroup, HistoryProps, HistoryTick, HistoryWords } from './history.types'

export const HISTORY_WORDS: HistoryWords = {
  summary: (total, counts, write) => {
    const attempts = counts.ok + counts.warn + counts.error + counts.running + counts.unknown
    const parts = [`${write(counts.ok)} succeeded`]
    if (counts.error > 0) parts.push(counts.error === 1 ? '1 failed' : `${write(counts.error)} failed`)
    if (counts.warn > 0) parts.push(counts.warn === 1 ? '1 with a remark' : `${write(counts.warn)} with remarks`)
    if (counts.running > 0) parts.push(`${write(counts.running)} still going`)
    if (counts.unknown > 0) parts.push(`${write(counts.unknown)} with no result`)
    // Said last, and said apart: "nobody looked" is about us rather than about the run.
    if (counts.empty > 0) parts.push(`${write(counts.empty)} never attempted`)
    return `${attempts === 1 ? 'The last attempt' : `The last ${total} attempts`}: ${parts.join(', ')}`
  },
  empty: 'Nothing has run yet',
  labelSeparator: ': ',
}

const countOf = (ticks: HistoryTick[]): HistoryCounts => {
  const counts: HistoryCounts = { ok: 0, warn: 0, error: 0, running: 0, unknown: 0, empty: 0 }
  for (const tick of ticks) {
    if (tick.empty) counts.empty += 1
    else if (tick.tone === undefined || tick.tone === 'neutral') counts.unknown += 1
    else counts[tick.tone] += 1
  }
  return counts
}

/**
 * What happened the last N times: one attempt, one mark, in time order with
 * the latest at the end. The uptime of a monitor, the nightly builds, the
 * retries of one step.
 *
 * It is not a sparkline and not a run. A sparkline draws a VALUE, and its
 * shape is the rise and fall of a number; here every attempt weighs the same
 * and carries one of an enumerable set of OUTCOMES, which a line cannot say.
 * A run draws the parts of ONE run, all of them alive at once and adding up
 * to "3 of 8 done"; here the marks are whole runs that are over, and nothing
 * adds up — what is read is the pattern of failures across time.
 *
 * The markup is chronological, oldest first, exactly as the array arrives:
 * the strip is pushed to its end by the theme, so what does not fit falls off
 * the START and the latest attempt is always visible.
 *
 * Two hundred empty marks are two hundred empty marks to a screen reader, so
 * the strip is ONE picture — `role="img"` — and its name carries the outcome
 * in words. The marks are not labelled and not focusable: an hour of a day in
 * a column is about 15px, far under the target size WCAG 2.2 asks for, and
 * the reading is owed to a reader through the name rather than through two
 * hundred tab stops. No machine: a history is a state, not a process.
 */
export function connect<T = Dict>(props: HistoryProps, normalize: Normalizer<T>, words: Partial<HistoryWords> = {}) {
  const { label, locale, size = 'md' } = props
  const w = { ...HISTORY_WORDS, ...words }
  const grouped = props.groups !== undefined
  const source: HistoryGroup[] = grouped ? props.groups! : [{ ticks: props.ticks ?? [] }]

  const all = source.flatMap((group) => group.ticks)
  const counts = countOf(all)
  const attempts = all.length - counts.empty
  const write = (count: number) => new Intl.NumberFormat(locale).format(count)
  const reading = attempts === 0 ? w.empty : w.summary(write(attempts), counts, write)
  const name = label ? `${label}${w.labelSeparator}${reading}` : reading

  // The ruler exists only when the batches are named: an axis of blank cells
  // would take room under the strip and say nothing.
  const axis = grouped && source.some((group) => group.label !== undefined)

  const tickProps = (tick: HistoryTick) =>
    normalize({
      ...anatomy.attrs('tick'),
      'data-tone': tick.empty ? undefined : tick.tone,
      'data-empty': tick.empty ? '' : undefined,
      title: tick.title,
      'aria-hidden': 'true',
    })

  return {
    counts,
    /** The attempts that happened: the ones nobody made are not among them. */
    attempts,
    /** The reading, as the strip is named by it. */
    label: name,
    grouped,
    axis,
    groups: source.map((group, index) => ({
      key: String(index),
      label: group.label,
      /** What the batch stands for, which is what sets its share of the strip. */
      count: group.count ?? group.ticks.length,
      ticks: group.ticks.map((tick, i) => ({ key: String(i), tick, tickProps: tickProps(tick) })),
      groupProps: normalize({
        ...anatomy.attrs('group'),
        title: group.title,
        'aria-hidden': 'true',
        // The share of the strip. A batch of one check is one brick, a batch
        // of seven is seven: equal slots would hold as many ticks as fit into
        // the narrowest of them, which on a real strip is about three.
        style: { '--gg-history-n': group.count ?? group.ticks.length },
      }),
    })),
    /** The cells of the ruler: the same shares as the batches above them, by one rule. */
    axisCells: source.map((group, index) => ({
      key: String(index),
      label: group.label ?? '',
      cellProps: normalize({
        ...anatomy.attrs('axis-cell'),
        'data-minor': group.minor ? '' : undefined,
        style: { '--gg-history-n': group.count ?? group.ticks.length },
      }),
    })),
    // The block that holds the strip and, under it, the ruler. The strip
    // cannot hold the ruler itself: it is a row of marks, and a second row
    // inside it would be one more mark.
    rootProps: normalize({ ...anatomy.attrs('root') }),
    stripProps: normalize({
      ...anatomy.attrs('strip'),
      role: 'img',
      'aria-label': name,
      'data-size': size,
      'data-grouped': grouped ? '' : undefined,
    }),
    // The ruler repeats what the strip's name already said, in figures the
    // reader has no use for: it is for the eye alone.
    axisProps: normalize({ ...anatomy.attrs('axis'), 'aria-hidden': 'true' }),
  }
}

export type HistoryApi<T = Dict> = ReturnType<typeof connect<T>>
