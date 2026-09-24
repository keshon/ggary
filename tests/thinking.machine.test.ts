import { describe, expect, it, vi } from 'vitest'
import { connect, thinkingIds } from '../packages/core/src/components/thinking'

const same = (p: Record<string, unknown>) => p

describe('thinking', () => {
  it('is a disclosure: the button owns the region by id', () => {
    const ids = thinkingIds('t1')
    const api = connect({ id: 't1' }, same)
    expect(api.triggerProps.id).toBe(ids.trigger)
    expect(api.triggerProps['aria-controls']).toBe(ids.content)
    expect(api.contentProps.id).toBe(ids.content)
    expect(api.contentProps['aria-labelledby']).toBe(ids.trigger)
  })

  it('is collapsed by default: the answer is what was asked for', () => {
    const api = connect({ id: 't1' }, same)
    expect(api.triggerProps['aria-expanded']).toBe('false')
    expect(api.contentProps.hidden).toBe(true)
    expect(api.rootProps['data-state']).toBe('closed')
  })

  it('open shows the region and turns the glyph', () => {
    const api = connect({ id: 't1', open: true }, same)
    expect(api.triggerProps['aria-expanded']).toBe('true')
    expect(api.contentProps.hidden).toBe(false)
    expect(api.indicatorProps['data-state']).toBe('open')
  })

  it('carries no tone and no dot: nothing here can fail', () => {
    const api = connect({ id: 't1' }, same)
    expect(api.rootProps['data-tone']).toBeUndefined()
    expect(Object.keys(api)).not.toContain('dotProps')
  })

  it('names a duration when it has one, and says it is still coming when it has not', () => {
    expect(connect({ id: 't1', duration: 4.2, locale: 'en-GB' }, same).label).toBe('Thought for 4.2 s')
    expect(connect({ id: 't1' }, same).label).toBe('Thought')
    const streaming = connect({ id: 't1', streaming: true, duration: 4.2 }, same)
    expect(streaming.label).toBe('Thinking…')
    expect(streaming.contentProps['aria-busy']).toBe('true')
    expect(streaming.showCaret).toBe(true)
  })

  it('toggles through the owner, and a disabled one does not', () => {
    const onToggle = vi.fn()
    ;(connect({ id: 't1' }, same, { onToggle }).triggerProps.onClick as () => void)()
    expect(onToggle).toHaveBeenCalledOnce()

    const off = connect({ id: 't1', disabled: true }, same, { onToggle })
    ;(off.triggerProps.onClick as () => void)()
    expect(onToggle).toHaveBeenCalledOnce()
    expect(off.triggerProps.disabled).toBe(true)
  })

  it('takes the words of another language', () => {
    const words = { thinking: 'Думает…', thoughtFor: (d: string) => `Думал ${d}`, seconds: 'с' }
    expect(connect({ id: 't1', duration: 3, locale: 'ru-RU' }, same, { words }).label).toBe('Думал 3 с')
    expect(connect({ id: 't1', streaming: true }, same, { words }).label).toBe('Думает…')
  })

  it('builds both ids from the one it was given', () => {
    expect(thinkingIds('gg-thinking-r1')).toEqual({
      root: 'gg-thinking-r1',
      trigger: 'gg-thinking-r1-trigger',
      content: 'gg-thinking-r1-content',
    })
  })
})
