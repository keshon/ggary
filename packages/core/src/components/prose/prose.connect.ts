import type { Dict, Normalizer } from '../../types'
import { proseAnatomy } from './prose.anatomy'
import type { ProseProps } from './prose.types'

export function connect<T = Dict>(props: ProseProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...proseAnatomy.attrs('root'), 'data-size': props.size ?? 'md' }),
  }
}
