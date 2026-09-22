import { describe, expect, it } from 'vitest'
import { connect, FILE_CHANGE_SIGNS, type FileChangeKind } from '../packages/core/src/components/file-change'

/** A file change has no state: the contract is the prop bags and the words. */
const same = (p: Record<string, unknown>) => p

const all: FileChangeKind[] = ['added', 'modified', 'deleted', 'renamed', 'conflict']

describe('file change', () => {
  it('draws a sign per change and names it in words', () => {
    expect(all.map((change) => connect({ change }, same).sign)).toEqual(['+', 'M', '−', 'R', '!'])
    expect(all.map((change) => connect({ change }, same).word)).toEqual(['Added', 'Modified', 'Deleted', 'Renamed', 'Conflict'])
  })

  it('the minus is a real minus sign, not a hyphen', () => {
    expect(FILE_CHANGE_SIGNS.deleted).not.toBe('-')
    expect(FILE_CHANGE_SIGNS.deleted.codePointAt(0)).toBe(0x2212)
  })

  it('carries the change as data, the sign hidden from assistive tech, the word as text', () => {
    const api = connect({ change: 'deleted' }, same)
    expect(api.rootProps).toEqual({ 'data-scope': 'file-change', 'data-part': 'root', 'data-change': 'deleted' })
    expect(api.signProps).toEqual({ 'data-scope': 'file-change', 'data-part': 'sign', 'aria-hidden': 'true' })
    expect(api.labelProps).toEqual({ 'data-scope': 'file-change', 'data-part': 'label' })
  })

  it('names no plain span: no aria-label and no role on the root', () => {
    for (const change of all) {
      const { rootProps } = connect({ change }, same)
      expect(rootProps['aria-label']).toBeUndefined()
      expect(rootProps.role).toBeUndefined()
    }
  })

  it('takes the words of another language, one change at a time', () => {
    const words = { added: 'Добавлен', deleted: 'Удалён' }
    expect(connect({ change: 'added' }, same, words).word).toBe('Добавлен')
    expect(connect({ change: 'deleted' }, same, words).word).toBe('Удалён')
    expect(connect({ change: 'renamed' }, same, words).word).toBe('Renamed')
  })

  it('a value outside the vocabulary draws no sign and takes no colour', () => {
    const api = connect({ change: 'copied' as FileChangeKind }, same)
    expect(api.sign).toBe('')
    expect(api.rootProps['data-change']).toBeUndefined()
    expect(api.word).toBe('copied')
    // Nor does a name inherited from Object count as one of the five.
    expect(connect({ change: 'toString' as FileChangeKind }, same).sign).toBe('')
  })
})
