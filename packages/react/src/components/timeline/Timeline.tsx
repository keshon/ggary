import type { HTMLAttributes, ReactNode } from 'react'
import { connect, type TimelineItem, type TimelineProps as CoreTimelineProps } from '@ggary/core/timeline'
import { reactNormalizer } from '@ggary/core'

export interface TimelineProps extends CoreTimelineProps, Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
  /**
   * A rich body in place of the title and detail. The dot and the time stay
   * the Timeline's; the tone still has to be said in words in what this draws.
   */
  children?: (item: TimelineItem) => ReactNode
}

export function Timeline({ items, label, locale, timeFormat, children, ...rest }: TimelineProps) {
  const api = connect({ items, label, locale, timeFormat }, reactNormalizer)
  return (
    <ol {...rest} {...api.rootProps}>
      {items.map((item) => {
        const parts = api.getItemProps(item)
        return (
          <li key={item.id} {...parts.itemProps}>
            <span {...parts.dotProps} />
            <div {...parts.bodyProps}>
              {children ? (
                children(item)
              ) : (
                <>
                  {item.title}
                  {parts.showDetail && <div {...parts.detailProps}>{item.detail}</div>}
                </>
              )}
            </div>
            {parts.showTime && <time {...parts.timeProps}>{parts.timeLabel}</time>}
          </li>
        )
      })}
    </ol>
  )
}
