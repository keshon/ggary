import { describe, expect, it } from 'vitest'
import { connect, kvAnatomy } from '../packages/core/src/components/kv'

/** A key–value list has no state: the contract is the prop bags. */
const same = (p: Record<string, unknown>) => p

describe('key–value list', () => {
  it('names the list, its names and its values', () => {
    const api = connect({}, same)
    expect(api.rootProps).toEqual({ 'data-scope': 'kv', 'data-part': 'root', 'data-tight': undefined })
    expect(api.termProps).toEqual({ 'data-scope': 'kv', 'data-part': 'term' })
    expect(api.detailProps).toEqual({ 'data-scope': 'kv', 'data-part': 'detail' })
    expect(kvAnatomy.parts).toEqual(['root', 'term', 'detail'])
  })

  it('tight hands the name column back to the content', () => {
    expect(connect({ tight: true }, same).rootProps['data-tight']).toBe('')
    expect(connect({ tight: false }, same).rootProps['data-tight']).toBeUndefined()
  })

  it('adds no role: the <dl> already says what it is', () => {
    const api = connect({}, same)
    expect(api.rootProps.role).toBeUndefined()
    expect(api.termProps.role).toBeUndefined()
  })
})
