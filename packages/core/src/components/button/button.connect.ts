import type { Dict, Normalizer } from '../../types'
import { buttonAnatomy } from './button.anatomy'
import type { ButtonProps } from './button.types'

/**
 * No machine. Button has no state of its own, so `core` contributes only the
 * attribute contract — which is still worth centralising, because it is what
 * every theme's button.css and the a11y tests are written against.
 */
export function connect<T = Dict>(props: ButtonProps, normalize: Normalizer<T>) {
  const {
    emphasis = 'medium',
    destructive = false,
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
  } = props

  return {
    rootProps: normalize({
      ...buttonAnatomy.attrs('root'),
      type,
      disabled: disabled || undefined,
      'aria-busy': loading ? 'true' : undefined,
      'data-emphasis': emphasis,
      'data-destructive': destructive ? '' : undefined,
      'data-size': size,
      'data-disabled': disabled ? '' : undefined,
      'data-loading': loading ? '' : undefined,
      'data-full-width': fullWidth ? '' : undefined,
    }),
    spinnerProps: normalize({ ...buttonAnatomy.attrs('spinner'), 'aria-hidden': 'true' }),
  }
}
