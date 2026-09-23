import type { DiffLine, DiffRow } from './diff.types'

/**
 * Two texts into rows, line by line.
 *
 * A line-level LCS and nothing more. Word-level marks inside a line, rename
 * detection, a three-way merge — those belong to whatever produced the change,
 * and a component that guessed at them would be guessing differently from the
 * tool the reader trusts. An application that already holds a patch hands the
 * rows over instead.
 *
 * The table is quadratic, so the common head and tail are taken off first,
 * which is most of a real edit, and a middle still too large for the table is
 * reported as a wholesale replacement rather than silently taking a second to
 * draw. `LCS_CELLS` is where that line falls.
 */

export const LCS_CELLS = 250_000

/** The lines of a text. A final newline ends the last line rather than opening another. */
export function textLines(text: string): string[] {
  if (text === '') return []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

export function diffLines(before: string, after: string, cells = LCS_CELLS): DiffLine[] {
  const a = textLines(before)
  const b = textLines(after)

  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail += 1

  const middleA = a.slice(head, a.length - tail)
  const middleB = b.slice(head, b.length - tail)

  const out: DiffLine[] = []
  let beforeNo = 1
  let afterNo = 1
  const push = (kind: DiffLine['kind'], text: string) => {
    if (kind === 'add') out.push({ kind, text, after: afterNo++ })
    else if (kind === 'del') out.push({ kind, text, before: beforeNo++ })
    else out.push({ kind, text, before: beforeNo++, after: afterNo++ })
  }

  for (let i = 0; i < head; i += 1) push('context', a[i])

  if (middleA.length * middleB.length > cells) {
    // Past the table's size the honest answer is the coarse one: everything
    // old went, everything new came. The alternative is a component that
    // stalls on a generated file.
    for (const text of middleA) push('del', text)
    for (const text of middleB) push('add', text)
  } else {
    const n = middleA.length
    const m = middleB.length
    // L[i][j]: the longest common subsequence of the tails a[i..] and b[j..].
    const width = m + 1
    const table = new Uint32Array((n + 1) * width)
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        table[i * width + j] =
          middleA[i] === middleB[j]
            ? table[(i + 1) * width + j + 1] + 1
            : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
      }
    }
    let i = 0
    let j = 0
    while (i < n || j < m) {
      if (i < n && j < m && middleA[i] === middleB[j]) {
        push('context', middleA[i])
        i += 1
        j += 1
      } else if (i < n && (j === m || table[(i + 1) * width + j] >= table[i * width + j + 1])) {
        // A deletion before the addition that replaces it: the order a patch is read in.
        push('del', middleA[i])
        i += 1
      } else {
        push('add', middleB[j])
        j += 1
      }
    }
  }

  for (let i = a.length - tail; i < a.length; i += 1) push('context', a[i])
  return out
}

/**
 * The unchanged stretches taken out and replaced by a fold that names how many
 * lines went. Skipping them in silence is the same lie about the volume as a
 * truncated output with no number on it.
 *
 * A run of one is left where it is: a fold takes a row too, and a fold of one
 * line saves nothing and costs the reader a line of the file.
 */
export function foldContext(lines: DiffLine[], context: number): DiffRow[] {
  // Infinite context is the file entire, and is the one value that must not
  // reach the loop below.
  if (!Number.isFinite(context) || context < 0) return [...lines]
  const keep = new Array<boolean>(lines.length).fill(false)
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].kind === 'context') continue
    keep[i] = true
    for (let d = 1; d <= context; d += 1) {
      if (i - d >= 0) keep[i - d] = true
      if (i + d < lines.length) keep[i + d] = true
    }
  }
  const out: DiffRow[] = []
  let dropped = 0
  const flush = () => {
    if (dropped === 0) return
    out.push({ kind: 'fold', count: dropped })
    dropped = 0
  }
  for (let i = 0; i < lines.length; i += 1) {
    if (keep[i]) {
      flush()
      out.push(lines[i])
      continue
    }
    // A single dropped line between two kept ones is cheaper shown than folded.
    if (!keep[i] && dropped === 0 && keep[i + 1] === true) {
      out.push(lines[i])
      continue
    }
    dropped += 1
  }
  flush()
  return out
}
