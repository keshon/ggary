import { describe, expect, it, vi } from 'vitest'
import { connect } from '../packages/core/src/components/copyable'

const same = <T,>(props: T) => props

describe('copyable', () => {
  it('the button is named with the value: a column of plain "Copy" is one word said ten times', () => {
    const api = connect({ value: 'a4f7c2e' }, same)
    expect(api.copyProps).toMatchObject({ 'data-scope': 'copyable', 'data-part': 'copy', type: 'button', 'aria-label': 'Copy a4f7c2e' })
    expect(api.copyIconProps).toMatchObject({ 'data-part': 'copy-icon', 'data-icon': 'copy', 'aria-hidden': 'true' })
    expect(api.valueProps).toMatchObject({ 'data-part': 'value', translate: 'no' })
  })

  it('copies copyValue behind an abbreviation, and is still named by what is shown', () => {
    const api = connect({ value: 'a4f7c2e', copyValue: 'a4f7c2e91b0d5537' }, same)
    expect(api.copyText).toBe('a4f7c2e91b0d5537')
    expect(api.copyProps['aria-label']).toBe('Copy a4f7c2e')
    expect(connect({ value: 'a4f7c2e' }, same).copyText).toBe('a4f7c2e')
  })

  it('shows the result and carries the words for the live region', () => {
    const idle = connect({ value: 'v' }, same)
    expect(idle.copyProps['data-copied']).toBeUndefined()
    expect(idle.said).toBe('')
    const copied = connect({ value: 'v', copy: { status: 'copied', said: 'Copied' } }, same)
    expect(copied.copyProps['data-copied']).toBe('true')
    expect(copied.copyIconProps['data-icon']).toBe('check')
    expect(copied.said).toBe('Copied')
    expect(connect({ value: 'v', copy: { status: 'failed', said: 'Could not copy' } }, same).copyProps['data-copied']).toBe('false')
    expect(idle.liveProps).toMatchObject({ role: 'status', 'aria-live': 'polite' })
  })

  it('takes its own words', () => {
    expect(connect({ value: 'v', words: { copy: (v) => `Скопировать ${v}` } }, same).copyProps['aria-label']).toBe('Скопировать v')
  })

  it('the press goes to the handler the adapter gave', () => {
    const press = vi.fn()
    ;(connect({ value: 'v' }, same, { onCopyPress: press }).copyProps.onClick as () => void)()
    expect(press).toHaveBeenCalledOnce()
  })
})
