import type { Dict, Normalizer } from '../../types'
import { connect as connectInput } from '../input/input.connect'
import { searchAnatomy } from './search.anatomy'
import type { SearchProps } from './search.types'

export interface SearchConnectOptions {
  onValueChange?: (value: string) => void
  /** The canonical control props of an enclosing Field. */
  field?: Dict
}

/**
 * A text field that is a search field: `type="search"`, which brings the clear
 * button and Escape with it. A cross of our own would need a script, and would
 * be a worse copy of one the platform already ships.
 *
 * The magnifier is decoration and hidden from assistive technology; the work is
 * named by the label. The input is an `input` part as well as a `search` one, so
 * a theme's field rules style it without being repeated here.
 */
export function connect<T = Dict>(props: SearchProps, normalize: Normalizer<T>, options: SearchConnectOptions = {}) {
  const { size, name, placeholder, label, disabled, readOnly, required, invalid } = props
  const { field, onValueChange } = options

  const input = connectInput<Dict>(
    { type: 'search', size, name, placeholder, disabled, readOnly, required, invalid },
    (bag) => bag,
    { onValueChange, field }
  )

  return {
    rootProps: normalize({
      ...searchAnatomy.attrs('root'),
      'data-size': size ?? 'md',
      'data-disabled': disabled || field?.disabled ? '' : undefined,
    }),
    iconProps: normalize({ ...searchAnatomy.attrs('icon'), 'data-icon': 'search', 'aria-hidden': 'true' }),
    // An input part, not a search one: the theme's field look is input.css's,
    // and the room for the glyph is written here against the wrapper.
    inputProps: normalize({
      ...input.rootProps,
      // A Field's <label for> names it; an aria-label would override that label.
      'aria-label': field ? undefined : label,
    }),
  }
}
