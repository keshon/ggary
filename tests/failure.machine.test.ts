import { describe, expect, it, vi } from 'vitest'
import { connect } from '../packages/core/src/components/failure'

const same = (p: Record<string, unknown>) => p
const base = {
  title: 'Could not read terrain/chunks.bin',
  code: 'EBUSY',
  reason: 'The file is locked by another process',
}

describe('failure', () => {
  it('interrupts while it is pending, and goes quiet once it is a record', () => {
    expect(connect(base, same).rootProps.role).toBe('alert')
    expect(connect({ ...base, live: 'polite' }, same).rootProps['aria-live']).toBe('polite')
    expect(connect({ ...base, live: 'off' }, same).rootProps.role).toBeUndefined()
    const resolved = connect({ ...base, state: 'resolved' }, same)
    expect(resolved.rootProps.role).toBeUndefined()
    expect(resolved.rootProps['aria-live']).toBeUndefined()
  })

  it('a code comes with its explanation: a code alone is not a reason but its identifier', () => {
    expect(connect(base, same).reason).toBe('The file is locked by another process (EBUSY)')
  })

  it('shows a way out only while pending, and keeps the record after', () => {
    const pending = connect(base, same)
    expect(pending.showActions).toBe(true)
    expect(pending.verdict).toBeUndefined()
    expect(connect({ ...base, state: 'resolved', resolvedAt: '14:33' }, same).verdict).toBe('Resolved at 14:33')
    expect(connect({ ...base, state: 'given-up' }, same).verdict).toBe('Given up')
    expect(connect({ ...base, state: 'given-up' }, same).showActions).toBe(false)
  })

  it('always offers the retry: a failure block with no way out is a note in red', () => {
    const onRetry = vi.fn()
    const api = connect(base, same, { onRetry })
    expect(api.retry.label).toBe('Retry')
    api.retry.onClick()
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('announces how many attempts there were before they are read', () => {
    const tried = ['A retry after 1 s — the same code', 'A retry after 4 s — the same code']
    expect(connect({ ...base, tried }, same).triedProps['aria-label']).toBe('Already tried: 2')
    expect(connect(base, same).triedProps['aria-label']).toBeUndefined()
    expect(connect({ ...base, tried }, same).tried).toEqual(tried)
  })

  it('carries the tone glyph, hidden from assistive tech: the heading already says it in words', () => {
    const api = connect(base, same)
    expect(api.iconProps['data-icon']).toBe('status-error')
    expect(api.iconProps['aria-hidden']).toBe('true')
  })

  it('carries the state as data, for the step back', () => {
    expect(connect(base, same).rootProps['data-state']).toBe('pending')
    expect(connect({ ...base, state: 'given-up' }, same).rootProps['data-state']).toBe('given-up')
  })

  it('takes the words of another language', () => {
    const words = {
      reason: (reason: string, code: string) => `${reason} [${code}]`,
      tried: (n: number) => `Уже пробовали: ${n}`,
      retry: 'Ещё раз',
      verdict: () => 'Сдались',
    }
    const api = connect({ ...base, tried: ['раз'], state: 'given-up' as const }, same, { words })
    expect(api.reason).toBe('The file is locked by another process [EBUSY]')
    expect(api.triedProps['aria-label']).toBe('Уже пробовали: 1')
    expect(api.verdict).toBe('Сдались')
    expect(connect(base, same, { words }).retry.label).toBe('Ещё раз')
  })
})
