import { useEffect, useRef, type HTMLAttributes } from 'react'
import { attachLogTail, connect, type LogProps as CoreLogProps, type LogWords } from '@ggary/core/log'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface LogProps extends CoreLogProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The levels in words, where the machine's word is not the reader's. */
  words?: LogWords
  /**
   * Hold the bottom as lines arrive, and let go the moment the reader scrolls
   * up. Default true — a log nobody scrolls should show its newest line.
   */
  tail?: boolean
}

export function Log(own: LogProps) {
  const { lines, label, locale, timeZone, announce, words, tail = true, ...rest } = useConfigured(own, { locale: true, words: 'log' })
  const api = connect({ lines, label, locale, timeZone, announce }, reactNormalizer, { words })
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tail || !root.current) return
    const following = attachLogTail(root.current)
    return () => following.dispose()
  }, [tail])

  return (
    <div ref={root} {...rest} {...api.rootProps}>
      {api.lines.map((line) => (
        <div key={line.key} {...line.lineProps}>
          <span {...api.timeProps}>{line.time}</span>
          <span {...api.levelProps}>{line.level}</span>
          <span {...api.messageProps}>{line.text}</span>
        </div>
      ))}
    </div>
  )
}
