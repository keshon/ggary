import type { Dict, Normalizer } from '../../types'
import { kvAnatomy } from './kv.anatomy'
import type { KeyValueListProps } from './kv.types'

/**
 * Name–value pairs of one object, read-only, on a real `<dl>`: the tie between
 * a name and its value is in the markup, so a reader hears them as a pair.
 * Two columns of `<div>`s look the same and are tied by nothing. No machine.
 *
 * The name column is one width the theme owns, so lists on the same screen
 * line up with each other; `tight` gives that up for a narrow container.
 */
export function connect<T = Dict>(props: KeyValueListProps, normalize: Normalizer<T>) {
  const { tight = false } = props
  return {
    rootProps: normalize({ ...kvAnatomy.attrs('root'), 'data-tight': tight ? '' : undefined }),
    termProps: normalize({ ...kvAnatomy.attrs('term') }),
    detailProps: normalize({ ...kvAnatomy.attrs('detail') }),
  }
}
