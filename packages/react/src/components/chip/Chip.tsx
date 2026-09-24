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
  const { emphasis, size, selected, disabled, removable, interactive, children, onRemove, ...rest } = props
  const isInteractive = interactive ?? false
  const api = connect(
    { emphasis, size, selected, disabled, removable: removable ?? !!onRemove, interactive: isInteractive },
    reactNormalizer,
    { onRemove })

  const content = (
    <>
      <span {...api.labelProps}>{children}</span>
      {(removable ?? !!onRemove) && (
        <span {...api.removeProps}>
          <span {...api.removeIconProps} />
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
