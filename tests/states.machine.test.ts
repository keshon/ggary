import { describe, expect, it } from 'vitest'
import { connectCaret, connectDot } from '../packages/core/src/components/states'

const same = (p: Record<string, unknown>) => p

describe('status dot connect', () => {
  it('is hidden from assistive tech: a word beside it names the state', () => {
    expect(connectDot({ tone: 'error' }, same).rootProps).toEqual({ 'data-scope': 'dot', 'data-part': 'root', 'data-tone': 'error', 'aria-hidden': 'true' })
  })

  it('without a tone it sets none, so it reads the nearest ancestor’s', () => {
    expect(connectDot({}, same).rootProps['data-tone']).toBeUndefined()
  })
})

describe('caret connect', () => {
  it('is a hidden mark with no state of its own', () => {
    expect(connectCaret(same).rootProps).toEqual({ 'data-scope': 'caret', 'data-part': 'root', 'aria-hidden': 'true' })
  })
})
