import { useId } from 'react'
import { connect, type ProgressProps as CoreProgressProps } from '@ggary/core/progress'
import { reactNormalizer } from '@ggary/core'
import { useConfigured } from '../config-provider'

export type ProgressProps = CoreProgressProps & {
  /** Show the value text. Default: over a bar with a label, and inside a large ring. */
  showValue?: boolean
}

/** How far along: a bar, or a ring. No value: busy, the amount unknown. */
export function Progress(props: ProgressProps) {
  props = useConfigured(props, { locale: true })
  const id = `gg-progress-${useId().replace(/:/g, '')}`
  const api = connect({ ...props, id }, reactNormalizer)
  const { shape = 'bar', size = 'md' } = props
  const label = props.hideLabel ? undefined : props.label
  const showValue = !api.indeterminate && (props.showValue ?? (shape === 'bar' ? label !== undefined : size === 'lg'))
  const valueText = showValue && <span {...api.valueTextProps}>{api.valueText}</span>

  if (shape === 'ring') {
    return (
      <div {...api.rootProps}>
        <div {...api.trackProps}>
          <div {...api.rangeProps} />
          {valueText}
        </div>
        {label && <span {...api.labelProps}>{label}</span>}
      </div>
    )
  }
  return (
    <div {...api.rootProps}>
      {(label || showValue) && (
        <div {...api.headerProps}>
          {label && <span {...api.labelProps}>{label}</span>}
          {valueText}
        </div>
      )}
      <div {...api.trackProps}>
        <div {...api.rangeProps} />
      </div>
    </div>
  )
}
