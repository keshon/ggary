import type { HTMLAttributes } from 'react'
import { connect, type ShareProps as CoreShareProps, type ShareWords } from '@ggary/core/share'
import { reactNormalizer } from '@ggary/core'

export interface ShareProps extends CoreShareProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The fixed text of the bar's name: the joining words and how a part is read. */
  words?: ShareWords
}

export function Share({ items, label, unit, locale, size, words, ...rest }: ShareProps) {
  const api = connect({ items, label, unit, locale, size }, reactNormalizer, words)
  return (
    <div {...rest} {...api.rootProps}>
      {api.segments.map((segment) => (
        <span key={segment.key} {...segment.segmentProps} />
      ))}
    </div>
  )
}
