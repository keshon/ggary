import { describe, expect, it } from 'vitest'
import { connect } from '../packages/core/src/components/turn'

/** A turn has no state: the contract is the prop bags and the cost line. */
const same = (p: Record<string, unknown>) => p

describe('turn', () => {
  it('marks only the person; the machine is the default and bare', () => {
    expect(connect({ who: 'You', from: 'user' }, same).rootProps['data-from']).toBe('user')
    expect(connect({ who: 'Agent', from: 'agent' }, same).rootProps['data-from']).toBeUndefined()
    expect(connect({ who: 'Agent' }, same).rootProps['data-from']).toBeUndefined()
  })

  it('takes no role: who spoke is the name in the head, not the surface', () => {
    const api = connect({ who: 'Agent' }, same)
    expect(api.rootProps).toEqual({ 'data-scope': 'turn', 'data-part': 'root' })
    expect(api.who).toBe('Agent')
    expect(api.whoProps).toEqual({ 'data-scope': 'turn', 'data-part': 'who' })
  })

  it('a turn still arriving is busy and asks for the caret', () => {
    const api = connect({ who: 'Agent', streaming: true }, same)
    expect(api.rootProps['aria-busy']).toBe('true')
    expect(api.rootProps['data-streaming']).toBe('')
    expect(api.showCaret).toBe(true)
    expect(connect({ who: 'Agent' }, same).showCaret).toBe(false)
  })

  it('states the cost and the duration as one line', () => {
    expect(connect({ who: 'Agent', tokens: 1284, duration: 4.12, locale: 'en-GB' }, same).cost).toBe('1,284 tokens · 4.1 s')
  })

  it('drops a tenth of a second past ten, where it is noise', () => {
    expect(connect({ who: 'Agent', duration: 42.4, locale: 'en-GB' }, same).cost).toBe('42 s')
    expect(connect({ who: 'Agent', duration: 9.94, locale: 'en-GB' }, same).cost).toBe('9.9 s')
  })

  it('states only what it was given, and nothing at all for neither', () => {
    expect(connect({ who: 'Agent', tokens: 512, locale: 'en-GB' }, same).cost).toBe('512 tokens')
    expect(connect({ who: 'Agent', duration: 2, locale: 'en-GB' }, same).cost).toBe('2 s')
    expect(connect({ who: 'Agent' }, same).cost).toBeUndefined()
  })

  it('counts a number that is not one as nothing', () => {
    expect(connect({ who: 'Agent', tokens: Number.NaN, duration: Number.POSITIVE_INFINITY }, same).cost).toBeUndefined()
    // Zero is a reading, not an absence.
    expect(connect({ who: 'Agent', tokens: 0, locale: 'en-GB' }, same).cost).toBe('0 tokens')
  })

  it('takes the units of another language', () => {
    const words = { tokens: 'токенов', seconds: 'с', separator: ', ' }
    expect(connect({ who: 'Агент', tokens: 1000, duration: 3, locale: 'en-GB' }, same, words).cost).toBe('1,000 токенов, 3 с')
  })
})
