import type { HTMLAttributes } from 'react'
import { connect, type LegendProps as CoreLegendProps, type LegendWords } from '@ggary/core/legend'
import { reactNormalizer } from '@ggary/core'

export interface LegendProps extends CoreLegendProps, Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /** The default name of the list in another language. */
  words?: Partial<LegendWords>
}

/** The key to a chart's colours: a swatch, the series in words, and its quantity. */
export function Legend({ items, direction, label, words, ...rest }: LegendProps) {
  const api = connect({ items, direction, label }, reactNormalizer, { words })
  return (
    <ul {...api.rootProps} {...rest}>
      {api.items.map((item, index) => {
        const entry = api.getItemProps(item)
        return (
          // Two series may share a label, so the position keys the item.
          <li key={index} {...entry.itemProps}>
            <span {...entry.swatchProps} />
            <span {...entry.labelProps}>{item.label}</span>
            {entry.showValue && <span {...entry.valueProps}>{item.value}</span>}
          </li>
        )
      })}
    </ul>
  )
}
