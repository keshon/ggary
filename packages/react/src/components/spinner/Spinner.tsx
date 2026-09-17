import { connect, type SpinnerProps } from '@ggary/core/spinner'
import { reactNormalizer } from '@ggary/core'

export type { SpinnerProps }

export function Spinner(props: SpinnerProps) {
  const api = connect(props, reactNormalizer)
  return (
    <span {...api.rootProps}>
      <span {...api.trackProps} />
      <span {...api.arcProps} />
    </span>
  )
}
