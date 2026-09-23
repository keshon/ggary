import type { Dict, Normalizer } from '../../types'
import { connectDot } from '../states/states.connect'
import { runAnatomy } from './run.anatomy'
import type { RunProps, RunUnit, RunWords } from './run.types'

/** The dot's own props, before this component's normalizer sees them. */
const same = (props: Dict) => props

export const RUN_WORDS: RunWords = {
  reading: (done, total) => `${done} of ${total} done`,
  failed: (count) => (count === 1 ? '1 failed' : `${count} failed`),
  warned: (count) => (count === 1 ? '1 with a remark' : `${count} with remarks`),
  separator: ', ',
  labelSeparator: ': ',
}

/**
 * The counting meter of one run: the phases, attempts or shards it is made of,
 * each a mark carrying its own outcome. The unit is countable and there are
 * few of them, which is the whole reason this is not a meter — 4 of 7 drawn as
 * a bar at 57% reports a precision the work does not have, and a bar cannot
 * say that one of the four failed. Past a couple of dozen units the eye stops
 * counting and a meter with a number is the right drawing instead.
 *
 * The unit is the kit's own state dot: it already knows the tone, the pulse of
 * `running` and forced colours, and a second circle in the kit would be a
 * second name for one thing. A unit with no tone has not begun.
 *
 * The role goes on the units rather than on the root, as the meter's does: a
 * progress bar's contents are not exposed, and the reading in words has to
 * stay in the document's text beside it. Both say the same thing — the dots
 * are the picture, `aria-valuenow` and `aria-valuetext` are the message, and
 * neither is allowed to be the only carrier. No machine: the outcomes come
 * from outside.
 */
export function connect<T = Dict>(props: RunProps, normalize: Normalizer<T>, words: Partial<RunWords> = {}) {
  const { units, label, locale } = props
  const w = { ...RUN_WORDS, ...words }
  const write = (n: number) => new Intl.NumberFormat(locale).format(n)
  const showValue = props.showValue ?? true

  // Finished is anything that has an outcome: `ok`, and `warn` and `error`
  // too — a unit that failed is over, and counting it as unfinished would
  // leave a run that ended reading as one still going.
  const total = units.length
  const done = units.filter((unit) => unit.tone !== undefined && unit.tone !== 'running').length
  const failed = units.filter((unit) => unit.tone === 'error').length
  const warned = units.filter((unit) => unit.tone === 'warn').length
  const running = units.some((unit) => unit.tone === 'running')

  const valueText = [
    w.reading(write(done), write(total)),
    failed > 0 ? w.failed(failed) : undefined,
    warned > 0 ? w.warned(warned) : undefined,
  ]
    .filter(Boolean)
    .join(w.separator)

  return {
    done,
    total,
    failed,
    warned,
    /** Something is going: the caller says so in words beside the strip too. */
    running,
    /** The reading: drawn in the value part, and spoken as `aria-valuetext`. */
    valueText,
    showValue,
    units: units.map((unit: RunUnit, index) => ({
      key: String(index),
      tone: unit.tone,
      title: unit.title,
      // The unit IS a state dot, with the dot's own scope: the theme sizes it
      // once and every mark in the kit agrees on what a tone looks like.
      dotProps: normalize({ ...connectDot({ tone: unit.tone }, same).rootProps, title: unit.title }),
    })),
    rootProps: normalize({ ...runAnatomy.attrs('root') }),
    unitsProps: normalize({
      ...runAnatomy.attrs('units'),
      role: 'progressbar',
      // The subject of the count. "4 of 7" with no subject is not a message.
      'aria-label': label ?? valueText,
      'aria-valuemin': 0,
      'aria-valuemax': total,
      'aria-valuenow': done,
      'aria-valuetext': label ? `${label}${w.labelSeparator}${valueText}` : valueText,
    }),
    // Drawn for the eye; the units say the same to a reader, so it is not read twice.
    valueProps: normalize({ ...runAnatomy.attrs('value'), 'aria-hidden': 'true' }),
  }
}

export type RunApi<T = Dict> = ReturnType<typeof connect<T>>
