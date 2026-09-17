import { connect, type SkeletonProps } from '@ggary/core/skeleton'
import { reactNormalizer } from '@ggary/core'

export type { SkeletonProps }

/** Put `aria-busy` on the region that is loading; the bars themselves say nothing. */
export function Skeleton(props: SkeletonProps) {
  const api = connect(props, reactNormalizer)
  return (
    <span {...api.rootProps}>
      {api.bars.map((bar) => (
        <span key={bar.key} {...bar.props} />
      ))}
    </span>
  )
}
