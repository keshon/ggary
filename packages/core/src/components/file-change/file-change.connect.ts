import type { Dict, Normalizer } from '../../types'
import { fileChangeAnatomy } from './file-change.anatomy'
import type { FileChangeKind, FileChangeProps, FileChangeWords } from './file-change.types'

/** The sign drawn in the outline: ordinary characters of the font, not pictograms. */
export const FILE_CHANGE_SIGNS: Record<FileChangeKind, string> = {
  added: '+',
  modified: 'M',
  deleted: '−',
  renamed: 'R',
  conflict: '!',
}

const WORDS: Record<FileChangeKind, string> = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
  renamed: 'Renamed',
  conflict: 'Conflict',
}

/**
 * The mark of what happened to a file, beside its name in a list of changes.
 * No machine and no role: it is read together with the name it stands by.
 *
 * Two carriers, parted because one is data and the other speech. The sign is
 * content, so it survives where colour does not — print, colour blindness,
 * forced colours — and is hidden from assistive tech, since "+" aloud is
 * "plus". The word is visually hidden text rather than an `aria-label`: ARIA
 * forbids naming a plain span, and screen readers that honour that would say
 * nothing at all.
 *
 * A value outside the vocabulary draws no sign and takes no colour.
 */
export function connect<T = Dict>(props: FileChangeProps, normalize: Normalizer<T>, options: { words?: FileChangeWords } = {}) {
  const { words = {} } = options
  const { change } = props
  const known = Object.hasOwn(FILE_CHANGE_SIGNS, change)
  return {
    sign: known ? FILE_CHANGE_SIGNS[change] : '',
    word: (known ? (words[change] ?? WORDS[change]) : undefined) ?? String(change),
    rootProps: normalize({ ...fileChangeAnatomy.attrs('root'), 'data-change': known ? change : undefined }),
    signProps: normalize({ ...fileChangeAnatomy.attrs('sign'), 'aria-hidden': 'true' }),
    labelProps: normalize({ ...fileChangeAnatomy.attrs('label') }),
  }
}
