import type { Dict, Normalizer } from '../../types'
import { diffAnatomy as anatomy } from './diff.anatomy'
import { diffLines, foldContext } from './diff.lines'
import type { DiffFold, DiffLine, DiffProps, DiffRow, DiffWords } from './diff.types'

export const DIFF_WORDS: Required<DiffWords> = {
  fold: (count) => `${count} lines skipped`,
  added: (count) => `+${count}`,
  // U+2212, the minus sign: a hyphen is a different character and reads as one.
  removed: (count) => `−${count}`,
  region: (path) => path,
}

const isFold = (row: DiffRow): row is DiffFold => row.kind === 'fold'

/**
 * What the agent changed in a file: the path, how much moved, and the lines
 * themselves.
 *
 * **Unified**, one column of code with both files' numbers beside it, and not
 * side by side. A diff in an agent's transcript stands in the column the
 * transcript is in; two panes halve that and set code wrapping, and code that
 * wraps is code that has stopped being read. Two panes also break the one
 * thing a diff exists for — selecting the changed lines and copying them —
 * because a selection across two columns arrives interleaved.
 *
 * The rows come from either end: a prepared list, for an application that
 * already holds a patch, or two texts, which are compared here (see
 * `diffLines`). Nothing else: a component that guessed at word-level marks
 * would be guessing differently from the tool the reader trusts.
 *
 * Colour is never the only carrier. The `+` and the `−` are drawn by the
 * theme from `data-kind` as pseudo-elements, so they survive a black-and-white
 * print and colour blindness, and still do not reach the clipboard; the line
 * numbers are not selectable, for the same reason.
 */
export function connect<T = Dict>(props: DiffProps, normalize: Normalizer<T>, words: DiffWords = {}) {
  const { path, rows, before, after, context = 3, locale } = props
  const w = { ...DIFF_WORDS, ...words }
  const format = new Intl.NumberFormat(locale)

  const computed: DiffRow[] = rows ?? (before === undefined && after === undefined ? [] : foldContext(diffLines(before ?? '', after ?? ''), context))

  let added = 0
  let removed = 0
  for (const row of computed) {
    if (row.kind === 'add') added += 1
    else if (row.kind === 'del') removed += 1
  }

  return {
    added,
    removed,
    addedText: w.added(format.format(added)),
    removedText: w.removed(format.format(removed)),

    rows: computed.map((row, index) => ({
      row,
      key: String(index),
      fold: isFold(row) ? w.fold(format.format(row.count)) : undefined,
      line: isFold(row) ? undefined : (row as DiffLine),
      rowProps: normalize({
        ...anatomy.attrs('row'),
        // Context carries no attribute: a line with no kind is unchanged.
        'data-kind': row.kind === 'add' || row.kind === 'del' ? row.kind : undefined,
      }),
      /** The old file's number, then the new one's. A blank where a line has none. */
      numbers: isFold(row) ? [] : [(row as DiffLine).before, (row as DiffLine).after],
    })),

    rootProps: normalize({ ...anatomy.attrs('root') }),
    headProps: normalize({ ...anatomy.attrs('head') }),
    // Truncated in the view; whole in the title, or the diff has no name.
    pathProps: normalize({ ...anatomy.attrs('path'), title: path }),
    statProps: normalize({ ...anatomy.attrs('stat') }),
    addedProps: normalize({ ...anatomy.attrs('added'), 'data-kind': 'add' }),
    removedProps: normalize({ ...anatomy.attrs('removed'), 'data-kind': 'del' }),
    bodyProps: normalize({
      ...anatomy.attrs('body'),
      // It scrolls sideways, so the keyboard has to reach the scroll — the
      // Code block's rule, and for the same reason.
      role: 'region',
      'aria-label': w.region(path),
      tabIndex: 0,
      dir: 'ltr',
      translate: 'no',
    }),
    numProps: normalize({ ...anatomy.attrs('num'), 'aria-hidden': 'true' }),
    codeProps: normalize({ ...anatomy.attrs('code') }),
    foldProps: normalize({ ...anatomy.attrs('fold') }),
  }
}

export type DiffApi<T = Dict> = ReturnType<typeof connect<T>>
