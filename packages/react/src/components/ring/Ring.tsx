import { connect, type RingProps as CoreRingProps } from '@ggary/core/ring'
import { reactNormalizer } from '@ggary/core'

export type RingProps = CoreRingProps

/** The same share as a meter's, in the size of a control. The geometry is core's; this only draws it. */
export function Ring(props: RingProps) {
  const api = connect(props, reactNormalizer)

  return (
    <svg {...api.rootProps}>
      <circle {...api.trackProps} />
      <circle {...api.arcProps} />
      {api.showValue && <text {...api.valueProps}>{api.shareText}</text>}
    </svg>
  )
}
