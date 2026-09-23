import type { Dict, Normalizer } from '../../types'
import { reading } from '../../utils/reading'
import { ringAnatomy } from './ring.anatomy'
import type { RingProps } from './ring.types'

/**
 * The same share as a meter's, in the size of a control: a ring stands beside
 * the text of a card, where a full-width bar has no room. One quantity against
 * its own ceiling, so one tone — never a series colour, which says "a category
 * among others" about a thing that has no others.
 *
 * An SVG, because the shape comes from the data rather than from a glyph set,
 * and the geometry is computed HERE. The box is 20 units and the radius 8, so
 * the circumference is 50.27 and the arc's dash comes straight off it; the
 * theme scales that box to a size in pixels and never touches the numbers.
 * The stroke is given in the same units, so it scales with the box.
 *
 * The arc is the whole circle dashed once and pushed round by the part that is
 * NOT filled — one property moves with the value, which is also the one that
 * can be transitioned. Turning the arc a quarter back, so the value starts at
 * the top, is the shared structure's: the figure inside is left upright, which
 * turning the whole svg would not do.
 *
 * A ring standing on its own is named by its `label` — an arc is a shape with
 * no text. One that only repeats a reading already written beside it is
 * `decorative`, and then says nothing at all rather than saying it twice.
 */

/** The box the geometry is computed in. Not arbitrary: the dash is the circumference at this radius. */
export const RING_BOX = { size: 20, centre: 10, radius: 8 } as const
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_BOX.radius

export function connect<T = Dict>(props: RingProps, normalize: Normalizer<T>) {
  const { label, tone, size = 'md' } = props
  const read = reading(props)
  const decorative = props.decorative ?? false
  const showValue = props.showValue ?? size === 'lg'
  const state = read.over ? 'over' : undefined
  const { centre, radius } = RING_BOX
  const circle = { cx: centre, cy: centre, r: radius }

  return {
    viewBox: `0 0 ${RING_BOX.size} ${RING_BOX.size}`,
    fraction: read.fraction,
    over: read.over,
    /** The reading in words: spoken, never drawn — there is no room for a sentence inside a ring. */
    valueText: read.text,
    /**
     * The figure at the centre: the share as a whole percentage, and bare. The
     * sign does not fit — "100%" at the floor of the type scale is wider than
     * the hole in the ring — so the unit and the context live in the words,
     * and the figure is a landmark for the eye that has already read them.
     */
    shareText: new Intl.NumberFormat(props.locale, { maximumFractionDigits: 0 }).format(read.fraction * 100),
    showValue,
    rootProps: normalize({
      ...ringAnatomy.attrs('root'),
      viewBox: `0 0 ${RING_BOX.size} ${RING_BOX.size}`,
      // A decorative ring repeats what already stands beside it in words: it
      // takes no role and no value, or a reader says the same figure twice.
      role: decorative ? undefined : 'meter',
      'aria-hidden': decorative ? 'true' : undefined,
      'aria-label': decorative ? undefined : label,
      'aria-valuemin': decorative ? undefined : 0,
      'aria-valuemax': decorative ? undefined : read.max,
      'aria-valuenow': decorative ? undefined : read.value,
      'aria-valuetext': decorative ? undefined : read.text,
      'data-tone': tone,
      'data-size': size,
      'data-state': state,
    }),
    trackProps: normalize({ ...ringAnatomy.attrs('track'), ...circle }),
    arcProps: normalize({
      ...ringAnatomy.attrs('arc'),
      ...circle,
      'data-state': state,
      style: {
        'stroke-dasharray': RING_CIRCUMFERENCE,
        'stroke-dashoffset': RING_CIRCUMFERENCE * (1 - read.fraction),
      },
    }),
    valueProps: normalize({ ...ringAnatomy.attrs('value'), x: centre, y: centre, 'aria-hidden': 'true' }),
  }
}

export type RingApi<T = Dict> = ReturnType<typeof connect<T>>
