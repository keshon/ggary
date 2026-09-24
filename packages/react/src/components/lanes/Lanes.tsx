import type { HTMLAttributes } from 'react'
import { connect, type LanesProps as CoreLanesProps, type LanesWords } from '@ggary/core/lanes'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface LanesProps extends CoreLanesProps, Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
  /** The chart's fixed text: how a stretch is read, and the outcomes in words. */
  words?: LanesWords
}

export function Lanes(own: LanesProps) {
  const { lanes, label, start, end, locale, words, ...rest } = useConfigured(own, { locale: true, words: 'lanes' })
  const api = connect({ lanes, label, start, end, locale }, reactNormalizer, { words })
  return (
    <ul {...rest} {...api.rootProps}>
      {api.lanes.map((lane) => (
        <li key={lane.key} {...lane.laneProps}>
          <span {...lane.labelProps}>{lane.lane.label}</span>
          <span {...lane.trackProps}>
            {lane.spans.map((span) => (
              <span key={span.key} {...span.spanProps} />
            ))}
          </span>
          <span {...api.laneTextProps}>{lane.text}</span>
        </li>
      ))}
    </ul>
  )
}
