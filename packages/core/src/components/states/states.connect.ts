import type { Dict, Normalizer } from '../../types'
import { caretAnatomy, dotAnatomy } from './states.anatomy'
import type { StatusDotProps } from './states.types'

/**
 * The state dot: a 6px mark in a tone. Hidden from assistive tech because a
 * dot always stands beside a word that names the state — a dot with no word
 * is colour as the only carrier, which is a defect, not a compact variant.
 * The colour is the theme's, read from the nearest tone, so the dot does not
 * need to be told a tone its container already has.
 */
export function connectDot<T = Dict>(props: StatusDotProps, normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...dotAnatomy.attrs('root'), 'data-tone': props.tone, 'aria-hidden': 'true' }),
  }
}

/**
 * The caret of text still arriving: a terminal cursor at the point the next
 * character will land. It belongs flush against the last character, so it is
 * placed inside the streaming text, after it. Hidden from assistive tech: the
 * fact that text is still coming is for the surrounding region to say (a
 * status, `aria-busy`), not for a rectangle to announce.
 */
export function connectCaret<T = Dict>(normalize: Normalizer<T>) {
  return {
    rootProps: normalize({ ...caretAnatomy.attrs('root'), 'aria-hidden': 'true' }),
  }
}
