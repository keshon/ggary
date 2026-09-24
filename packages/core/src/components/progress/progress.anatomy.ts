import { createAnatomy } from '../../types'

/**
 * How far along something is: a bar, or a ring. A `progressbar` with its
 * value, range and a spoken text; with no value it is indeterminate — busy, the
 * amount unknown — and says nothing about how far.
 *
 * The drawn amount is one number, `--gg-progress` (0 to 1), set on the track:
 * the bar's range scales by it, the ring's arc sweeps it. Data, not a look, as
 * the slider's fill is.
 */

export const progressAnatomy = createAnatomy('progress', ['root', 'header', 'label', 'value-text', 'track', 'range'] as const)
export type ProgressPart = (typeof progressAnatomy.parts)[number]
