import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, part, parts, typeInto } from './harness'

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))
const type = typeInto

/**
 * TimePicker: a combobox whose list is the times at a step. Typing opens it on
 * the nearest time and Enter commits what was typed; the arrows walk it and
 * Enter chooses the time walked to.
 */
export function timeConformance(adapter: Adapter) {
  describe('time picker', () => {
    const setup = async (props: Partial<Parameters<Adapter['timePicker']>[0]> = {}) => {
      const onValueChange = vi.fn()
      const m = await adapter.timePicker({ label: 'Starts at', locale: 'en-US', step: 30, onValueChange, ...props }, freshTarget())
      const input = () => part(m.root, 'time-picker', 'input') as HTMLInputElement
      const list = () => part(m.root, 'time-picker', 'content')!
      const options = () => parts(m.root, 'time-picker', 'item')
      return { m, input, list, options, onValueChange }
    }

    it('is a labelled combobox over a listbox of times, closed until asked', async () => {
      const { m, input, list, options } = await setup({ defaultValue: '14:00' })
      expect(input().getAttribute('role')).toBe('combobox')
      expect(input().getAttribute('aria-expanded')).toBe('false')
      expect(input().getAttribute('aria-controls')).toBe(list().id)
      expect(part(m.root, 'time-picker', 'label')!.getAttribute('for')).toBe(input().id)
      expect(input().value).toMatch(/^2:00\sPM$/)
      expect(list().getAttribute('role')).toBe('listbox')
      expect(options()).toHaveLength(0)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('opens on the value with the arrows, walks the list, and Enter chooses the time walked to', async () => {
      const { input, options, onValueChange } = await setup({ defaultValue: '14:00' })
      await adapter.act(() => key(input(), 'ArrowDown'))
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(options()).toHaveLength(48)
      expect(input().getAttribute('aria-activedescendant')).toBe(options().find((o) => o.getAttribute('aria-selected') === 'true')!.id)
      await adapter.act(() => key(input(), 'ArrowDown'))
      await adapter.act(() => key(input(), 'Enter'))
      expect(onValueChange).toHaveBeenLastCalledWith('14:30')
      expect(input().getAttribute('aria-expanded')).toBe('false')
      expect(input().value).toMatch(/^2:30\sPM$/)
    })

    it('typing opens the list on the nearest time; Enter keeps what was typed, off the step too', async () => {
      const { input, onValueChange } = await setup()
      await adapter.act(() => type(input(), '9:37 pm'))
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(document.getElementById(input().getAttribute('aria-activedescendant')!)!.textContent!.trim()).toMatch(/^9:30\sPM$/)
      await adapter.act(() => key(input(), 'Enter'))
      expect(onValueChange).toHaveBeenLastCalledWith('21:37')
    })

    it('a press on a time chooses it; one outside min and max, or disabled, cannot be', async () => {
      const { input, options, onValueChange } = await setup({ min: '09:00', max: '12:00', isTimeDisabled: (time) => time === '10:00' })
      await adapter.act(() => key(input(), 'ArrowDown'))
      expect(options().map((o) => o.textContent!.trim())).toHaveLength(7)
      const ten = options().find((o) => o.textContent!.trim().startsWith('10:00'))!
      expect(ten.getAttribute('aria-disabled')).toBe('true')
      await adapter.act(() => click(ten))
      expect(onValueChange).not.toHaveBeenCalled()
      await adapter.act(() => click(options()[1]))
      expect(onValueChange).toHaveBeenLastCalledWith('09:30')
    })

    it('says a typed text that is not a time, in the locale’s clock, and submits HH:mm by name', async () => {
      const { m, input } = await setup({ name: 'starts', defaultValue: '08:15' })
      expect((m.root.querySelector('input[type="hidden"]') as HTMLInputElement).value).toBe('08:15')
      await adapter.act(() => type(input(), 'soon'))
      await adapter.act(() => key(input(), 'Enter'))
      expect(input().getAttribute('aria-invalid')).toBe('true')
      const error = part(m.root, 'time-picker', 'error')!
      expect(input().getAttribute('aria-describedby')).toBe(error.id)
      expect(error.textContent).toMatch(/2:30\sPM/)
    })

    it('reads and writes in twenty-four hours where the locale does', async () => {
      const { input, onValueChange } = await setup({ locale: 'de-DE', defaultValue: '14:00' })
      expect(input().value).toBe('14:00')
      await adapter.act(() => type(input(), '7.45'))
      await adapter.act(() => key(input(), 'Enter'))
      expect(onValueChange).toHaveBeenLastCalledWith('07:45')
    })
  })
}
