import type { Dict, Normalizer } from '../../types'
import { iconAnatomy as anatomy } from './icon.anatomy'
import type { IconProps } from './icon.types'

/**
 * Decoration by default: most icons stand beside words that already say what
 * they mean, and a screen reader reading "download, Download" is noise. Given
 * a label, the icon is the only carrier of its meaning, and is an image with
 * that name.
 */
export function connect<T = Dict>(props: IconProps, normalize: Normalizer<T>) {
  const { name, label, size } = props
  return {
    rootProps: normalize({
      ...anatomy.attrs('root'),
      'data-icon': name,
      'data-size': size,
      role: label ? 'img' : undefined,
      'aria-label': label || undefined,
      'aria-hidden': label ? undefined : 'true',
    }),
  }
}
