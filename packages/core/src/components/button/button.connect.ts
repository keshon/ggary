import type { Dict, Normalizer } from '../../types'
import { buttonAnatomy } from './button.anatomy'
import type { ButtonProps } from './button.types'

/**
 * No machine. Button has no state of its own, so `core` contributes only the
 * attribute contract — which is still worth centralising, because it is what
 * `styles/button.css` and the a11y tests are written against.
 */
export function connect<T = Dict>(props: ButtonProps, normalize: Normalizer<T>) {
  const { variant = 'solid', size = 'md', disabled = false, loading = false, fullWidth = false, type = 'button' } = props
  const inactive = disabled || loading

  return {
    rootProps: normalize({
      ...buttonAnatomy.attrs('root'),
      type,
      disabled: inactive || undefined,
      'aria-busy': loading ? 'true' : undefined,
      'data-variant': variant,
      'data-size': size,
      'data-disabled': inactive ? '' : undefined,
      'data-loading': loading ? '' : undefined,
      'data-full-width': fullWidth ? '' : undefined,
    }),
    spinnerProps: normalize({ ...buttonAnatomy.attrs('spinner'), 'aria-hidden': 'true' }),
  }
}
