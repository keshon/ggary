import type { Dict, Normalizer } from '../../types'
import { skeletonAnatomy } from './skeleton.anatomy'
import type { SkeletonProps, SkeletonShape } from './skeleton.types'

/**
 * Bars in the shape of the text that is coming, each one line tall. Hidden
 * from assistive tech: there is nothing to read in them. The region that is
 * loading says so with aria-busy — that is the caller's, because only the
 * caller knows where the content will land.
 */
export function connect<T = Dict>(props: SkeletonProps, normalize: Normalizer<T>) {
  const { lines = 1, title = false } = props
  const count = Math.max(0, Math.floor(lines))
  const shapes: SkeletonShape[] = [
    ...(title ? (['title'] as const) : []),
    ...Array.from({ length: count }, (_, i): SkeletonShape => (count > 1 && i === count - 1 ? 'short' : 'line')),
  ]
  return {
    rootProps: normalize({ ...skeletonAnatomy.attrs('root'), 'aria-hidden': 'true' }),
    bars: shapes.map((shape, index) => ({
      key: `${shape}-${index}`,
      props: normalize({ ...skeletonAnatomy.attrs('bar'), 'data-shape': shape }),
    })),
  }
}
