import type { HTMLAttributes } from 'react'
import { connect, type StepsProps as CoreStepsProps } from '@ggary/core/steps'
import { reactNormalizer } from '@ggary/core'

export interface StepsProps extends CoreStepsProps, Omit<HTMLAttributes<HTMLOListElement>, 'children'> {}

export function Steps({ items, label, ...rest }: StepsProps) {
  const api = connect({ items, label }, reactNormalizer)
  return (
    <ol {...rest} {...api.rootProps}>
      {items.map((item, index) => {
        const parts = api.getItemProps(item)
        return (
          <li key={`${item.name}-${index}`} {...parts.itemProps}>
            <span {...parts.nameProps}>{item.name}</span>
            <span {...parts.noteProps}>{parts.note}</span>
          </li>
        )
      })}
    </ol>
  )
}
