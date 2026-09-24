import type { HTMLAttributes } from 'react'
import { connect, type RunProps as CoreRunProps, type RunWords } from '@ggary/core/run'
import { reactNormalizer } from '@ggary/core'

export interface RunProps extends CoreRunProps, Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The fixed text of the reading. */
  words?: Partial<RunWords>
}

/** The countable units of one run: phases, attempts or shards, each carrying its own outcome. */
export function Run({ units, label, showValue, locale, words, ...rest }: RunProps) {
  const api = connect({ units, label, showValue, locale }, reactNormalizer, { words })
  return (
    <span {...rest} {...api.rootProps}>
      <span {...api.unitsProps}>
        {api.units.map((unit) => (
          <span key={unit.key} {...unit.dotProps} />
        ))}
      </span>
      {api.showValue && <span {...api.valueProps}>{api.valueText}</span>}
    </span>
  )
}
