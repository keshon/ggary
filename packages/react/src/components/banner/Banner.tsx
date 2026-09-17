import type { ReactNode } from 'react'
import { connect, type BannerProps as CoreBannerProps } from '@ggary/core/banner'
import { reactNormalizer } from '@ggary/core'

export interface BannerProps extends CoreBannerProps {
  /** The detail under the title. */
  children?: ReactNode
  /** One or two actions at the far edge. */
  actions?: ReactNode
  /** Shows a close button. Remove the banner when it is called. */
  onDismiss?: () => void
}

export function Banner({ tone, title, live, dismissible, dismissLabel, children, actions, onDismiss }: BannerProps) {
  const api = connect({ tone, title, live, dismissible: dismissible ?? !!onDismiss, dismissLabel }, reactNormalizer, onDismiss)
  return (
    <div {...api.rootProps}>
      {api.showIcon && <span {...api.iconProps} />}
      <div {...api.bodyProps}>
        {title !== undefined && <p {...api.titleProps}>{title}</p>}
        {children !== undefined && <div {...api.textProps}>{children}</div>}
      </div>
      {actions !== undefined && <div {...api.actionsProps}>{actions}</div>}
      {api.showClose && (
        <button {...api.closeProps}>
          <span {...api.closeIconProps} />
        </button>
      )}
    </div>
  )
}
