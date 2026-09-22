import { Fragment, type ReactNode } from 'react'
import { connect, type KeyValueItem, type KeyValueListProps as CoreKeyValueListProps } from '@ggary/core/kv'
import { reactNormalizer } from '@ggary/core'

export interface KeyValueListProps extends CoreKeyValueListProps {
  /** The pairs, in reading order. A value may be any node: a badge, a link, a time. */
  items: KeyValueItem<ReactNode>[]
}

export function KeyValueList({ items, tight }: KeyValueListProps) {
  const api = connect({ tight }, reactNormalizer)
  return (
    <dl {...api.rootProps}>
      {items.map((item, index) => (
        // A name may repeat within one object's list, so the position keys it.
        <Fragment key={index}>
          <dt {...api.termProps}>{item.label}</dt>
          <dd {...api.detailProps}>{item.value}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
