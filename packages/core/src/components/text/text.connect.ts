import type { Dict, Normalizer } from '../../types'
import { textAnatomy } from './text.anatomy'
import type { TextElement, TextProps } from './text.types'

/** The element a text is, most meaningful first. */
export function textElement(props: TextProps): TextElement {
  if (props.code) return 'code'
  if (props.kbd) return 'kbd'
  if (props.mark) return 'mark'
  if (props.deleted) return 'del'
  if (props.strong) return 'strong'
  return 'span'
}

/**
 * Every asked-for way is also an attribute, so a theme draws `strong` on a
 * <code> the same as on a <strong>. A cut to lines passes its count as
 * `--gg-text-lines`, which the structure layer clamps to.
 */
export function connect<T = Dict>(props: TextProps, normalize: Normalizer<T>) {
  const { tone, emphasis = 'medium', strong, code, kbd, mark, deleted, truncate } = props
  const lines = typeof truncate === 'number' && truncate > 1 ? Math.floor(truncate) : undefined
  const flag = (on: boolean | undefined) => (on ? '' : undefined)
  return {
    element: textElement(props),
    rootProps: normalize({
      ...textAnatomy.attrs('root'),
      'data-tone': tone,
      'data-emphasis': emphasis,
      'data-strong': flag(strong),
      'data-code': flag(code),
      'data-kbd': flag(kbd),
      'data-mark': flag(mark),
      'data-deleted': flag(deleted),
      'data-truncate': lines ? 'lines' : truncate ? 'line' : undefined,
      style: lines ? { '--gg-text-lines': String(lines) } : undefined,
    }),
  }
}
