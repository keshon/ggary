import { describe, expect, it } from 'vitest'
import { connect, diffLines, foldContext, textLines, type DiffRow } from '../packages/core/src/components/diff'

/** A diff has no state: the contract is the rows it works out and the prop bags. */
const same = (p: Record<string, unknown>) => p

const shape = (lines: ReturnType<typeof diffLines>) => lines.map((line) => `${line.kind[0]}${line.text}`)

describe('the lines of a text', () => {
  it('ends the last line with a final newline rather than opening another', () => {
    expect(textLines('a\nb\n')).toEqual(['a', 'b'])
    expect(textLines('a\nb')).toEqual(['a', 'b'])
    expect(textLines('a\r\nb\r\n')).toEqual(['a', 'b'])
    expect(textLines('')).toEqual([])
    expect(textLines('\n')).toEqual([''])
  })
})

describe('two texts into rows', () => {
  it('keeps what did not change and marks what did', () => {
    expect(shape(diffLines('a\nb\nc\n', 'a\nB\nc\n'))).toEqual(['ca', 'db', 'aB', 'cc'])
  })

  it('reads a deletion before the addition that replaces it', () => {
    const rows = diffLines('one\n', 'two\n')
    expect(rows.map((row) => row.kind)).toEqual(['del', 'add'])
  })

  it('numbers each side by its own file, and leaves a blank where a line has none', () => {
    const rows = diffLines('a\nb\nc\n', 'a\nB\nc\n')
    expect(rows.map((row) => [row.before, row.after])).toEqual([
      [1, 1],
      [2, undefined],
      [undefined, 2],
      [3, 3],
    ])
  })

  it('finds the longest run in common rather than lining the files up end to end', () => {
    // A line inserted in the middle: one addition, not four changes.
    expect(shape(diffLines('a\nb\nc\nd\n', 'a\nb\nX\nc\nd\n'))).toEqual(['ca', 'cb', 'aX', 'cc', 'cd'])
    // A line taken out of the middle: one deletion.
    expect(shape(diffLines('a\nb\nX\nc\n', 'a\nb\nc\n'))).toEqual(['ca', 'cb', 'dX', 'cc'])
  })

  it('a file that arrived and one that went are wholly added and wholly deleted', () => {
    expect(shape(diffLines('', 'a\nb\n'))).toEqual(['aa', 'ab'])
    expect(shape(diffLines('a\nb\n', ''))).toEqual(['da', 'db'])
    expect(diffLines('', '')).toEqual([])
  })

  it('an unchanged file has no changes at all', () => {
    expect(diffLines('a\nb\n', 'a\nb\n').every((row) => row.kind === 'context')).toBe(true)
  })

  it('past the table’s size it says so coarsely rather than stalling', () => {
    // The cap is on the MIDDLE, after the common head and tail are taken off,
    // so a large file with a small edit still gets a real diff.
    const before = Array.from({ length: 400 }, (_, i) => `line ${i}`).join('\n')
    const after = before.replace('line 200', 'line 200 changed')
    expect(shape(diffLines(before, after, 9)).filter((row) => row[0] !== 'c')).toEqual(['dline 200', 'aline 200 changed'])

    // A middle past the cap: everything old went, everything new came.
    const rows = diffLines('a\nb\nc\nd\n', 'w\nx\ny\nz\n', 9)
    expect(rows.map((row) => row.kind)).toEqual(['del', 'del', 'del', 'del', 'add', 'add', 'add', 'add'])
  })
})

describe('the folded stretches', () => {
  const file = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n')
  const edited = file.replace('line 15', 'line 15 changed')

  it('keeps the context it is asked for and folds the rest, naming how many went', () => {
    const rows = foldContext(diffLines(file, edited), 3)
    expect(rows[0]).toEqual({ kind: 'fold', count: 11 })
    expect(rows.at(-1)).toEqual({ kind: 'fold', count: 12 })
    expect(rows.filter((row) => row.kind === 'context')).toHaveLength(6)
  })

  it('the whole file is the whole file', () => {
    const lines = diffLines(file, edited)
    expect(foldContext(lines, Number.POSITIVE_INFINITY)).toEqual(lines)
    expect(foldContext(lines, Number.POSITIVE_INFINITY).some((row) => row.kind === 'fold')).toBe(false)
  })

  it('a run of one line is shown rather than folded: a fold takes a row too', () => {
    // Two changes eight lines apart, three of context each way: line 9 stands
    // alone between them, and line 1 alone before the first. Neither is folded.
    const two = file.replace('line 5', 'line 5 changed').replace('line 13', 'line 13 changed')
    const rows = foldContext(diffLines(file, two), 3)
    expect(rows.filter((row) => row.kind === 'fold')).toEqual([{ kind: 'fold', count: 14 }])
    for (const text of ['line 1', 'line 9']) {
      expect(rows.some((row) => row.kind === 'context' && (row as { text: string }).text === text)).toBe(true)
    }
  })
})

describe('diff', () => {
  const rows: DiffRow[] = [
    { kind: 'context', text: 'const size = 256;', before: 41, after: 41 },
    { kind: 'del', text: 'let seed = 0;', before: 42 },
    { kind: 'add', text: 'let seed = Date.now();', after: 42 },
    { kind: 'fold', count: 18 },
  ]
  const api = connect({ path: 'terrain/heightmap.ts', rows }, same)

  it('takes rows already worked out, and does not diff them again', () => {
    expect(api.rows.map((row) => row.rowProps['data-kind'])).toEqual([undefined, 'del', 'add', undefined])
    expect(api.rows[3].fold).toBe('18 lines skipped')
    expect(api.rows[0].fold).toBeUndefined()
  })

  it('counts what moved, and marks the counts on the same axis as the lines', () => {
    expect([api.added, api.removed]).toEqual([1, 1])
    expect([api.addedText, api.removedText]).toEqual(['+1', '−1'])
    expect(api.addedProps['data-kind']).toBe('add')
    expect(api.removedProps['data-kind']).toBe('del')
  })

  it('the minus of the count is a minus sign, not a hyphen', () => {
    expect(api.removedText.codePointAt(0)).toBe(0x2212)
  })

  it('works the rows out from two texts when it is given them', () => {
    const fromText = connect({ path: 'a.ts', before: 'a\nb\n', after: 'a\nB\n' }, same)
    expect(fromText.rows.map((row) => row.rowProps['data-kind'])).toEqual([undefined, 'del', 'add'])
    expect([fromText.added, fromText.removed]).toEqual([1, 1])
  })

  it('a context line carries no kind: unchanged is the right default', () => {
    expect(api.rows[0].rowProps['data-kind']).toBeUndefined()
  })

  it('gives each line both files’ numbers, with a blank where it has none', () => {
    expect(api.rows.slice(0, 3).map((row) => row.numbers)).toEqual([
      [41, 41],
      [42, undefined],
      [undefined, 42],
    ])
    expect(api.rows[3].numbers).toEqual([])
  })

  it('keeps the whole path in a title, and names the scrolling body', () => {
    expect(api.pathProps.title).toBe('terrain/heightmap.ts')
    expect(api.bodyProps.role).toBe('region')
    expect(api.bodyProps['aria-label']).toBe('terrain/heightmap.ts')
    expect(api.bodyProps.tabIndex).toBe(0)
    expect(api.bodyProps.dir).toBe('ltr')
  })

  it('keeps the numbers out of a selection’s reach, and out of speech', () => {
    expect(api.numProps['aria-hidden']).toBe('true')
  })

  it('a file with nothing in it and nothing to show is an empty diff, not a crash', () => {
    const empty = connect({ path: 'x.ts' }, same)
    expect(empty.rows).toEqual([])
    expect([empty.addedText, empty.removedText]).toEqual(['+0', '−0'])
  })

  it('the fixed words are the page’s to change', () => {
    const russian = connect({ path: 'a.ts', rows }, same, { fold: (count) => `пропущено строк: ${count}`, region: (path) => `Изменения в ${path}` })
    expect(russian.rows[3].fold).toBe('пропущено строк: 18')
    expect(russian.bodyProps['aria-label']).toBe('Изменения в a.ts')
  })

  it('formats the figures in the page’s locale', () => {
    const many = connect({ path: 'a.ts', rows: [{ kind: 'fold', count: 12_000 }], locale: 'en-GB' }, same)
    expect(many.rows[0].fold).toBe('12,000 lines skipped')
  })
})
