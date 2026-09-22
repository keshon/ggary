import type { HTMLAttributes } from 'react'
import { connect, type InsertsProps as CoreInsertsProps } from '@ggary/core/inserts'
import { reactNormalizer } from '@ggary/core'

export interface InsertsProps extends CoreInsertsProps, Omit<HTMLAttributes<HTMLDivElement>, 'onInsert'> {}

export function Inserts({ items, target, onInsert, label, ...rest }: InsertsProps) {
  const api = connect({ items, target, onInsert, label }, reactNormalizer)
  return (
    <div {...api.rootProps} {...rest}>
      {api.items.map((item) => (
        <button key={item.value} {...api.itemProps(item)}>
          {api.itemLabel(item)}
        </button>
      ))}
    </div>
  )
}
