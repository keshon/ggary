import type { HTMLAttributes } from 'react'
import { connect, type RunProps as CoreRunProps, type RunWords } from '@ggary/core/run'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface RunProps extends CoreRunProps, Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The fixed text of the reading. */
  words?: Partial<RunWords>
}

/** The countable units of one run: phases, attempts or shards, each carrying its own outcome. */
export function Run(own: RunProps) {
  const { units, label, showValue, locale, words, ...rest } = useConfigured(own, { locale: true, words: 'run' })
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
