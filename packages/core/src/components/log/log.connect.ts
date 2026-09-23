import type { Dict, Normalizer } from '../../types'
import type { StatusTone } from '../../utils/tone'
import { logAnatomy as anatomy } from './log.anatomy'
import type { LogLevel, LogLine, LogProps, LogWords } from './log.types'

/**
 * Which levels take a colour. `debug` and `info` take none: a stream where
 * every line is coloured has no highlighting left for the line that matters.
 */
export const LOG_TONES: Partial<Record<LogLevel, StatusTone>> = { warn: 'warn', error: 'error' }

export const LOG_WORDS: Required<LogWords> = { debug: 'debug', info: 'info', warn: 'warn', error: 'error' }

/** A time to the second, in 24 hours: a log is read as a column of times. */
export function logTime(time: LogLine['time'], locale: string | undefined, timeZone: string | undefined): string {
  if (time === undefined) return ''
  if (typeof time === 'string') return time
  const date = time instanceof Date ? time : new Date(time)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone }).format(date)
}

/**
 * A stream of lines from a machine: a time, a level, a message, in three
 * columns of fixed width, so a log is read down its columns rather than as
 * continuous text.
 *
 * Why not a CodeBlock: a block of code is one text, finished, with line
 * numbers and a copy button. A log has a level and a time per line, it keeps
 * arriving while the work goes on, and it is announced — a region records are
 * added to, not a document. The two have monospaced type in common and
 * nothing else.
 *
 * Filtering by level and virtualising tens of thousands of lines are the
 * application's: both depend on where the lines come from. Following the tail
 * is not — see `attachLogTail`, which is the one piece that has to know when
 * the reader has scrolled away.
 */
export function connect<T = Dict>(props: LogProps, normalize: Normalizer<T>, words: LogWords = {}) {
  const { lines, label, locale, timeZone, announce = false } = props
  const w = { ...LOG_WORDS, ...words }

  return {
    lines: lines.map((line, index) => ({
      line,
      key: line.id ?? String(index),
      time: logTime(line.time, locale, timeZone),
      /** The level as a word beside the colour, never the colour alone. */
      level: w[line.level] ?? line.level,
      text: line.text,
      lineProps: normalize({
        ...anatomy.attrs('line'),
        'data-level': line.level,
        'data-tone': LOG_TONES[line.level],
      }),
    })),

    rootProps: normalize({
      ...anatomy.attrs('root'),
      role: 'log',
      'aria-label': label,
      // A polite live region by implication of the role; switched off unless
      // the page says its log speaks slowly enough to be spoken.
      'aria-live': announce ? 'polite' : 'off',
      // The region scrolls, so the keyboard has to be able to reach the scroll.
      tabIndex: 0,
    }),
    timeProps: normalize({ ...anatomy.attrs('time') }),
    levelProps: normalize({ ...anatomy.attrs('level') }),
    messageProps: normalize({ ...anatomy.attrs('message') }),
  }
}

export type LogApi<T = Dict> = ReturnType<typeof connect<T>>
