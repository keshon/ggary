import type { HTMLAttributes } from 'react'
import { connect, type HeatmapProps as CoreHeatmapProps, type HeatmapWords } from '@ggary/core/heatmap'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface HeatmapProps extends CoreHeatmapProps, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The fixed text of the field's name and of a cell's title. */
  words?: HeatmapWords
}

export function Heatmap(own: HeatmapProps) {
  const { days, weekStart, label, unit, locale, words, ...rest } = useConfigured(own, { locale: true, words: 'heatmap' })
  const api = connect({ days, weekStart, label, unit, locale }, reactNormalizer, { words })
  return (
    <div {...rest} {...api.rootProps}>
      {api.weeks.map((week) => (
        <div key={week.key} {...week.weekProps}>
          {week.monthLabel && <span {...week.monthLabelProps}>{week.monthLabel}</span>}
          {week.days.map((day) => (
            <span key={day.key} {...day.dayProps} />
          ))}
        </div>
      ))}
    </div>
  )
}
