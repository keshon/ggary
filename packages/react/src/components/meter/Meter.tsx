import { useId } from 'react'
import { connect, type MeterProps as CoreMeterProps } from '@ggary/core/meter'
import { reactNormalizer } from '@ggary/core'

export type MeterProps = CoreMeterProps

/** One quantity against its own ceiling. A reading, not a job: no value means nothing here. */
export function Meter(props: MeterProps) {
  const id = `gg-meter-${useId().replace(/:/g, '')}`
  const api = connect({ ...props, id }, reactNormalizer)

  return (
    <div {...api.rootProps}>
      {api.showLabel && <span {...api.labelProps}>{props.label}</span>}
      {api.showValue && <span {...api.valueProps}>{api.valueText}</span>}
      <div {...api.trackProps}>
        <div {...api.fillProps} />
      </div>
    </div>
  )
}
