import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { COPY_IDLE, COPY_WORDS, copiedAttr, type CopyState } from '../../utils/copy'
import { copyableAnatomy } from './copyable.anatomy'
import type { CopyableProps } from './copyable.types'

/**
 * A single-line value with a copy button beside it, in the flow and always
 * visible. A button in the corner shown on hover is a code block's trick:
 * beside a one-line value it lies over the last characters, and on touch,
 * where there is no hover, it does not exist.
 *
 * The button is named with the value — "Copy a4f7c2e" — because a column of
 * ten plain "Copy" buttons is one word said ten times. The name uses the value
 * as shown, so what is heard matches what is seen, even when `copyValue`
 * copies more.
 */
export function connect<T = Dict>(props: CopyableProps & { copy?: CopyState }, normalize: Normalizer<T>, options: { onCopyPress?: () => void } = {}) {
  const { onCopyPress } = options
  const { value, copy = COPY_IDLE } = props
  const words = { ...COPY_WORDS, ...props.words }

  return {
    copyText: props.copyValue ?? value,
    said: copy.said,
    rootProps: normalize({ ...copyableAnatomy.attrs('root') }),
    valueProps: normalize({ ...copyableAnatomy.attrs('value'), translate: 'no' }),
    copyProps: normalize({
      ...copyableAnatomy.attrs('copy'),
      type: 'button',
      'aria-label': words.copy(value),
      'data-copied': copiedAttr(copy.status),
      onClick: onCopyPress,
    }),
    copyIconProps: normalize({
      ...copyableAnatomy.attrs('copy-icon'),
      'data-icon': (copy.status === 'copied' ? 'check' : 'copy') satisfies IconName,
      'aria-hidden': 'true',
    }),
    liveProps: normalize({ ...copyableAnatomy.attrs('live'), role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }),
  }
}
