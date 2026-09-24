import type { ReactNode } from 'react'
import { connect, connectRow, type MetricProps, type MetricRowProps as CoreMetricRowProps } from '@ggary/core/metric'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export type { MetricProps }

export interface MetricRowProps extends CoreMetricRowProps {
  /** The metrics. */
  children?: ReactNode
}

export function Metric(own: MetricProps) {
  const { label, value, unit, delta, direction, tone, locale } = useConfigured(own, { locale: true })
  const api = connect({ label, value, unit, delta, direction, tone, locale }, reactNormalizer)
  return (
    <div {...api.rootProps}>
      <div {...api.labelProps}>{label}</div>
      <div {...api.valueProps}>
        {api.valueText}
        {api.showUnit && <span {...api.unitProps}>{unit}</span>}
      </div>
      {api.showDelta && (
        <div {...api.deltaProps}>
          {api.showDeltaIcon && <span {...api.deltaIconProps} />}
          {delta}
        </div>
      )}
    </div>
  )
}

export function MetricRow({ joined, headline, children }: MetricRowProps) {
  const api = connectRow({ joined, headline }, reactNormalizer)
  return <div {...api.rootProps}>{children}</div>
}
