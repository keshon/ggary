import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { connect, type PanelProps as CorePanelProps } from '@ggary/core/panel'
import { reactNormalizer } from '@ggary/core'

export interface PanelProps extends CorePanelProps, Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controls in the header, at its far edge. */
  actions?: ReactNode
  children?: ReactNode
}

export function Panel({ title, headingLevel, body, plain, rank, tone, region, scrollable, actions, children, ...rest }: PanelProps) {
  const id = `gg-panel-${useId().replace(/:/g, '')}`
  const api = connect({ id, title, headingLevel, body, plain, rank, tone, region, scrollable }, reactNormalizer)
  const Title = api.titleElement
  return (
    <div {...api.rootProps} {...rest}>
      {(title !== undefined || actions !== undefined) && (
        <div {...api.headerProps}>
          {title !== undefined && <Title {...api.titleProps}>{title}</Title>}
          {actions !== undefined && <div {...api.actionsProps}>{actions}</div>}
        </div>
      )}
      <div {...api.bodyProps}>{children}</div>
    </div>
  )
}
