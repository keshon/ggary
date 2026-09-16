import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { connect, type ChipProps as CoreChipProps } from '@ggary/core/chip'
import { reactNormalizer } from '@ggary/core'

export interface ChipProps extends CoreChipProps, Omit<HTMLAttributes<HTMLElement>, 'onSelect'> {
  children?: ReactNode
  onRemove?: () => void
}

/**
 * Stateless, like Button. Renders a <button> only when it does something —
 * a decorative tag should not be a tab stop.
 */
export const Chip = forwardRef<HTMLElement, ChipProps>(function Chip(props, ref) {
  const { variant, size, selected, disabled, removable, interactive, children, onRemove, ...rest } = props
  const isInteractive = interactive ?? false
  const api = connect(
    { variant, size, selected, disabled, removable: removable ?? !!onRemove, interactive: isInteractive },
    reactNormalizer,
    onRemove
  )

  const content = (
    <>
      <span {...api.labelProps}>{children}</span>
      {(removable ?? !!onRemove) && (
        <span {...api.removeProps}>
          <RemoveIcon />
        </span>
      )}
    </>
  )

  return isInteractive ? (
    <button ref={ref as React.Ref<HTMLButtonElement>} {...api.rootProps} {...rest}>
      {content}
    </button>
  ) : (
    <span ref={ref as React.Ref<HTMLSpanElement>} {...api.rootProps} {...rest}>
      {content}
    </span>
  )
})

export function RemoveIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
