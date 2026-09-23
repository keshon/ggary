import type { Dict, Normalizer } from '../../types'
import { reading } from '../../utils/reading'
import { meterAnatomy } from './meter.anatomy'
import type { MeterProps } from './meter.types'

/**
 * One quantity against its own ceiling: a budget spent, a share of the time, a
 * step's readiness. A label and the reading in words on one line, the bar
 * under them — a number to the LEFT of the bar would eat its length, and the
 * length here is the data. No machine: the value comes from outside.
 *
 * It is a reading, not a job: `role="meter"`, not `progressbar`. A progress
 * bar promises that the number is going up and will finish; a meter promises
 * nothing but the reading. The native `<meter>` says the same thing and is
 * refused for one reason: its bar is drawn by the platform, differently on
 * every one of them, and neither `::-webkit-meter-bar` nor Firefox's own
 * pseudo-elements can be styled through one selector. A theme that cannot
 * paint the fill cannot hold the fill to 3:1, so the element that carries the
 * semantics is a div with the role.
 *
 * Colour is never the only carrier: the drawn share is repeated as a number in
 * the value part, and said again as `aria-valuetext`. Over the maximum the
 * drawing clamps at the end of the track and the words say it is over.
 *
 * There is no threshold prop, and no forecast of exhaustion. Whether 88% of
 * something is a warning is the application's judgement, not the meter's — the
 * same 88% is fine for a disk and alarming for an error budget — so the tone
 * is given rather than derived. A forecast needs a rate over time, which one
 * value and one ceiling cannot supply; it belongs in the words beside the bar.
 */
export function connect<T = Dict>(props: MeterProps & { id: string }, normalize: Normalizer<T>) {
  const { id, label, tone, size = 'md' } = props
  const read = reading(props)
  const showLabel = Boolean(label) && !props.hideLabel
  const showValue = props.showValue ?? true
  const state = read.over ? 'over' : undefined
  const ids = { label: `${id}-label` }

  return {
    ids,
    fraction: read.fraction,
    over: read.over,
    /** The reading in words: drawn in the value part, and spoken as `aria-valuetext`. */
    valueText: read.text,
    showLabel,
    showValue,
    rootProps: normalize({
      ...meterAnatomy.attrs('root'),
      id,
      'data-tone': tone,
      'data-size': size,
      'data-state': state,
    }),
    labelProps: normalize({ ...meterAnatomy.attrs('label'), id: ids.label }),
    /**
     * The role is on the track rather than the root, as the progress bar's is:
     * the label and the reading then stay in the document's text instead of
     * inside a range widget, whose contents assistive tech does not expose.
     */
    trackProps: normalize({
      ...meterAnatomy.attrs('track'),
      role: 'meter',
      'aria-labelledby': showLabel ? ids.label : undefined,
      'aria-label': label && !showLabel ? label : undefined,
      'aria-valuemin': 0,
      'aria-valuemax': read.max,
      'aria-valuenow': read.value,
      'aria-valuetext': read.text,
      'data-state': state,
      style: { '--gg-meter': read.fraction },
    }),
    fillProps: normalize({ ...meterAnatomy.attrs('fill'), 'data-state': state }),
    // Shown for the eye; the track says the same to a reader, so it is not read twice.
    valueProps: normalize({ ...meterAnatomy.attrs('value'), 'aria-hidden': 'true' }),
  }
}

export type MeterApi<T = Dict> = ReturnType<typeof connect<T>>
