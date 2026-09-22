import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { COPY_IDLE, COPY_WORDS, copiedAttr, type CopyState } from '../../utils/copy'
import { codeAnatomy } from './code.anatomy'
import type { CodeBlockProps, CodeBlockWords } from './code.types'

export const CODE_WORDS: CodeBlockWords = { ...COPY_WORDS, label: 'Code' }

export interface CodeLine {
  number: number
  source: string
}

/** The lines of a text. A final newline ends the last line rather than opening another. */
export function codeLines(code: string, start = 1): CodeLine[] {
  const lines = code.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((source, index) => ({ number: start + index, source }))
}

/**
 * A block of code. There is no line wrapping — a wrap in a command changes
 * its meaning — so the content scrolls sideways, and because it scrolls it is
 * a named region with a tab stop: a keyboard has to reach the scroll too.
 *
 * The copy button stands in the far top corner, always visible: on touch there
 * is no hover to reveal it. Its result is shown on the button (`data-copied`)
 * and said through the block's own polite live region.
 *
 * `copy` is the adapter's copying state; `onCopyPress` starts a copy of
 * `copyText`.
 */
export function connect<T = Dict>(props: CodeBlockProps & { copy?: CopyState }, normalize: Normalizer<T>, onCopyPress?: () => void) {
  const { code, numbered = false, start = 1, copy = COPY_IDLE } = props
  const words = { ...CODE_WORDS, ...props.words }
  const label = props.label ?? words.label

  return {
    numbered,
    lines: numbered ? codeLines(code, start) : [],
    copyText: props.copyValue ?? code,
    said: copy.said,
    rootProps: normalize({ ...codeAnatomy.attrs('root'), 'data-numbered': numbered || undefined }),
    contentProps: normalize({
      ...codeAnatomy.attrs('content'),
      role: 'region',
      'aria-label': label,
      tabIndex: 0,
      // Code reads left to right in an interface of any direction.
      dir: 'ltr',
      translate: 'no',
    }),
    lineProps: (line: CodeLine) => normalize({ ...codeAnatomy.attrs('line'), 'data-line': line.number }),
    // Read by eye to find a place; to a screen reader a number before every
    // line is noise between the code and the listener.
    lineNumberProps: normalize({ ...codeAnatomy.attrs('line-number'), 'aria-hidden': 'true' }),
    lineSourceProps: normalize({ ...codeAnatomy.attrs('line-source') }),
    copyProps: normalize({
      ...codeAnatomy.attrs('copy'),
      type: 'button',
      'aria-label': words.copy(label),
      'data-copied': copiedAttr(copy.status),
      onClick: onCopyPress,
    }),
    copyIconProps: normalize({
      ...codeAnatomy.attrs('copy-icon'),
      'data-icon': (copy.status === 'copied' ? 'check' : 'copy') satisfies IconName,
      'aria-hidden': 'true',
    }),
    liveProps: normalize({ ...codeAnatomy.attrs('live'), role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' }),
  }
}
