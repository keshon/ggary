import type { Dict, Normalizer } from '../../types'
import { toolbarAnatomy as anatomy } from './toolbar.anatomy'
import type { ToolbarProps } from './toolbar.types'

/**
 * A strip of tools inside a panel: modes, filters, small actions on its
 * content. Not a page header, and not a menu.
 *
 * `role="toolbar"` is a promise — one tab stop and arrow keys — so it is made
 * only when the strip is named, and the adapter then attaches utils/toolbar to
 * keep it. Instrument leaves the role out entirely and says the behaviour
 * belongs to the application; here the behaviour comes with the name.
 */
export function connect<T = Dict>(props: ToolbarProps, normalize: Normalizer<T>) {
  const { label, orientation = 'horizontal' } = props
  const managed = Boolean(label)

  return {
    /** Whether the adapter should attach the arrow keys. */
    managed,
    rootProps: normalize({
      ...anatomy.attrs('root'),
      role: managed ? 'toolbar' : undefined,
      'aria-label': label,
      'aria-orientation': managed && orientation === 'vertical' ? 'vertical' : undefined,
      'data-orientation': orientation,
    }),
    separatorProps: normalize({ ...anatomy.attrs('separator'), 'aria-hidden': 'true' }),
    spacerProps: normalize({ ...anatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}
