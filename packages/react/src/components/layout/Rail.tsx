import { useId, type HTMLAttributes } from 'react'
import { connect, type RailItem, type RailProps as CoreRailProps } from '@ggary/core/rail'
import { reactNormalizer } from '@ggary/core'
import { connect as connectStatusBar, type StatusBarProps as CoreStatusBarProps } from '@ggary/core/status-bar'
import type { ReactNode } from 'react'
import type { StatusTone } from '@ggary/core'

export interface RailProps extends Omit<CoreRailProps, 'id'>, Omit<HTMLAttributes<HTMLElement>, 'children'> {}

/** The sections as a narrow column: a glyph over a short name. */
export function Rail({ label, items, ...rest }: RailProps) {
  const id = `gg-rail-${useId().replace(/:/g, '')}`
  const api = connect({ id, label, items }, reactNormalizer)
  const link = (item: RailItem) => {
    const parts = api.getItemProps(item)
    return (
      <a key={item.href} {...parts.itemProps}>
        <span {...parts.iconProps} />
        <span {...parts.labelProps}>{item.label}</span>
        {parts.showCount && <span {...parts.countProps}>{item.count}</span>}
      </a>
    )
  }
  return (
    <nav {...rest} {...api.rootProps}>
      {api.start.map(link)}
      {api.end.length > 0 && <span {...api.spacerProps} />}
      {api.end.map(link)}
    </nav>
  )
}

export interface StatusBarProps extends CoreStatusBarProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode
}

/** One line of readings along the bottom of a tool. */
export function StatusBar({ label, children, ...rest }: StatusBarProps) {
  const api = connectStatusBar({ label }, reactNormalizer)
  return (
    <div {...rest} {...api.rootProps}>
      {children}
    </div>
  )
}

export interface StatusBarItemProps extends HTMLAttributes<HTMLSpanElement> {
  /** For a reading that is news: the count of errors, a failed sync. */
  tone?: StatusTone
  children: ReactNode
}

/** A reading. One that can be pressed is a small low Button instead. */
export function StatusBarItem({ tone, children, ...rest }: StatusBarItemProps) {
  const api = connectStatusBar({}, reactNormalizer)
  return (
    <span {...rest} {...api.getItemProps(tone)}>
      {children}
    </span>
  )
}

/** Everything after it stands at the far end of the strip. */
export function StatusBarSpacer() {
  const api = connectStatusBar({}, reactNormalizer)
  return <span {...api.spacerProps} />
}
