import type { HTMLAttributes } from 'react'
import { connect, type HistoryProps as CoreHistoryProps, type HistoryWords } from '@ggary/core/history'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface HistoryProps extends CoreHistoryProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The fixed text of the strip's name. */
  words?: Partial<HistoryWords>
}

/** What happened the last N times: one attempt, one mark, the latest at the end. */
export function History(own: HistoryProps) {
  const { ticks, groups, label, size, locale, words, ...rest } = useConfigured(own, { locale: true, words: 'history' })
  const api = connect({ ticks, groups, label, size, locale }, reactNormalizer, { words })
  return (
    <div {...rest} {...api.rootProps}>
      <div {...api.stripProps}>
        {api.grouped
          ? api.groups.map((group) => (
              <span key={group.key} {...group.groupProps}>
                {group.ticks.map((tick) => (
                  <span key={tick.key} {...tick.tickProps} />
                ))}
              </span>
            ))
          : api.groups[0].ticks.map((tick) => <span key={tick.key} {...tick.tickProps} />)}
      </div>
      {api.axis && (
        <div {...api.axisProps}>
          {api.axisCells.map((cell) => (
            <span key={cell.key} {...cell.cellProps}>
              {cell.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
