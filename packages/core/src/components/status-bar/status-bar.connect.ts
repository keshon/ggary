import type { Dict, Normalizer } from '../../types'
import type { StatusTone } from '../../utils/tone'
import { statusBarAnatomy as anatomy } from './status-bar.anatomy'

export interface StatusBarProps {
  /** Names the strip as a group: "Editor status". Without it the strip is plain readings. */
  label?: string
}

/**
 * A strip ONE LINE tall of readings rather than controls — the branch and the
 * errors at the start, the mode and the encoding at the end. A toolbar is the
 * wrong thing: it holds controls and is as tall as they are, where this has to
 * stay one line or it eats the screen of the tool it serves.
 *
 * A reading that can be pressed is a small low button; one that is only read
 * is an item. An item may carry a tone, for the count of errors. When the
 * strip is too narrow it scrolls sideways rather than cutting its end off.
 */
export function connect<T = Dict>(props: StatusBarProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({
      ...anatomy.attrs('root'),
      role: props.label ? 'group' : undefined,
      'aria-label': props.label,
    }),
    getItemProps: (tone?: StatusTone) => normalize({ ...anatomy.attrs('item'), 'data-tone': tone }),
    spacerProps: normalize({ ...anatomy.attrs('spacer'), 'aria-hidden': 'true' }),
  }
}
