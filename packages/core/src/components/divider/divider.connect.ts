import type { Dict, Normalizer } from '../../types'
import { dividerAnatomy } from './divider.anatomy'
import type { DividerProps } from './divider.types'

/**
 * A separator, not an <hr>: an <hr> cannot hold a label. Its orientation is
 * said, since a vertical one is the exception; a labelled one is named by the
 * label, and the words on the line are drawn for the eye alone.
 */
export function connect<T = Dict>(props: DividerProps, normalize: Normalizer<T>) {
  const { orientation = 'horizontal', align = 'start', emphasis = 'low' } = props
  const label = orientation === 'horizontal' && props.label ? props.label : undefined
  return {
    label,
    rootProps: normalize({
      ...dividerAnatomy.attrs('root'),
      role: 'separator',
      'aria-orientation': orientation,
      'aria-label': label,
      'data-orientation': orientation,
      'data-emphasis': emphasis,
      'data-align': label ? align : undefined,
      'data-labelled': label ? '' : undefined,
    }),
    labelProps: normalize({ ...dividerAnatomy.attrs('label'), 'aria-hidden': 'true' }),
  }
}
