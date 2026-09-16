import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { connect, type ButtonProps as CoreButtonProps } from '@ggary/core/button'
import { reactNormalizer } from '@ggary/core'

export interface ButtonProps
  extends CoreButtonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled'> {
  children?: ReactNode
}

/**
 * The whole adapter. This is what "thin" is supposed to mean — if it grows past
 * a screen, logic has leaked out of core.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { variant, size, disabled, loading, fullWidth, type, children, ...rest } = props
  const api = connect({ variant, size, disabled, loading, fullWidth, type }, reactNormalizer)

  return (
    <button ref={ref} {...api.rootProps} {...rest}>
      {loading && <span {...api.spinnerProps} />}
      {children}
    </button>
  )
})
