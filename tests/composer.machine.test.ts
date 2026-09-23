import { describe, expect, it, vi } from 'vitest'
import { connect, keyIntent } from '../packages/core/src/components/composer'

const same = (p: Record<string, unknown>) => p
const rules = { submitOnEnter: true, busy: false, disabled: false }

describe('composer: the rules of sending', () => {
  it('Enter sends, Shift+Enter breaks the line', () => {
    expect(keyIntent({ key: 'Enter' }, rules)).toBe('send')
    expect(keyIntent({ key: 'Enter', shiftKey: true }, rules)).toBe('newline')
  })

  it('no other chord sends: one nobody documented must not post a message by accident', () => {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      expect(keyIntent({ key: 'Enter', [modifier]: true }, rules)).toBe('newline')
    }
  })

  it("an IME's Enter is choosing a candidate, from either shape of event", () => {
    expect(keyIntent({ key: 'Enter', isComposing: true }, rules)).toBe('newline')
    // React's synthetic event does not carry isComposing; its native one does.
    expect(keyIntent({ key: 'Enter', nativeEvent: { isComposing: true } }, rules)).toBe('newline')
  })

  it('no key but Enter ever sends', () => {
    for (const key of ['a', 'Tab', 'NumpadEnter', 'Escape']) expect(keyIntent({ key }, rules)).toBe('newline')
  })

  it('while the machine works there is nothing to send to', () => {
    expect(keyIntent({ key: 'Enter' }, { ...rules, busy: true })).toBe('newline')
    expect(keyIntent({ key: 'Enter' }, { ...rules, disabled: true })).toBe('newline')
    expect(keyIntent({ key: 'Enter' }, { ...rules, submitOnEnter: false })).toBe('newline')
  })
})

describe('composer', () => {
  it('names the field, never the frame: the frame takes no focus', () => {
    const api = connect({ label: 'Describe a task' }, same)
    expect(api.fieldProps['aria-label']).toBe('Describe a task')
    expect(api.rootProps['aria-label']).toBeUndefined()
    expect(api.rootProps).toEqual({ 'data-scope': 'composer', 'data-part': 'root', 'data-bar': 'edge' })
  })

  it('the field grows from one line to eight, and the bar says where it stands', () => {
    const api = connect({ label: 'Ask' }, same)
    expect(api.fieldProps.rows).toBe(1)
    expect(api.fieldProps.maxRows).toBe(8)
    expect(api.fieldProps.autoResize).toBe(true)
    expect(api.barProps['data-bar']).toBe('edge')
    expect(connect({ label: 'Ask', bar: 'row' }, same).barProps['data-bar']).toBe('row')
  })

  it('sending and stopping are one control, never two', () => {
    const onSend = vi.fn()
    const onStop = vi.fn()
    const idle = connect({ label: 'Ask' }, same, { onSend, onStop })
    expect(idle.sendProps['aria-label']).toBe('Send')
    expect(idle.sendIconProps['data-icon']).toBe('arrow-up')
    ;(idle.sendProps.onClick as () => void)()
    expect(onSend).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()

    const working = connect({ label: 'Ask', busy: true }, same, { onSend, onStop })
    expect(working.stops).toBe(true)
    expect(working.sendProps['aria-label']).toBe('Stop')
    expect(working.sendIconProps['data-icon']).toBe('stop')
    ;(working.sendProps.onClick as () => void)()
    expect(onStop).toHaveBeenCalledOnce()
    expect(onSend).toHaveBeenCalledOnce()
  })

  it('busy is not disabled: stopping is exactly what is wanted then', () => {
    expect(connect({ label: 'Ask', busy: true, disabled: true }, same).sendProps.disabled).toBeUndefined()
    expect(connect({ label: 'Ask', disabled: true }, same).sendProps.disabled).toBe(true)
    expect(connect({ label: 'Ask' }, same).sendProps.disabled).toBeUndefined()
  })

  it('a send from the keyboard stops the newline landing after it', () => {
    const onSend = vi.fn()
    const preventDefault = vi.fn()
    const api = connect({ label: 'Ask' }, same, { onSend })
    const press = api.fieldProps.onKeyDown as (event: unknown) => void
    press({ key: 'Enter', preventDefault })
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onSend).toHaveBeenCalledOnce()

    press({ key: 'Enter', shiftKey: true, preventDefault })
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(onSend).toHaveBeenCalledOnce()
  })

  it('the button is a button: inside a form an unnamed type submits it', () => {
    expect(connect({ label: 'Ask' }, same).sendProps.type).toBe('button')
  })

  it('takes the words of another language', () => {
    const api = connect({ label: 'Спросить', busy: true }, same, {}, { send: 'Отправить', stop: 'Остановить' })
    expect(api.sendProps['aria-label']).toBe('Остановить')
  })
})
