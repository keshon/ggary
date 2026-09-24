import { describe, expect, it } from 'vitest'
import { setInputValue } from '../../packages/core/src/index'
import { type Adapter, type CalendarProps, type DatePickerProps, click, freshTarget, part, parts } from './harness'

type Range = { start: string | null; end: string | null }

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))

const dayOf = (root: ParentNode, date: string) => root.querySelector<HTMLElement>(`[data-scope="calendar"][data-part="day"][data-date="${date}"]`)!

/**
 * The calendar and the date picker in each framework: a grid of days with one
 * tab stop that the keyboard walks, a range chosen by two presses, and a field
 * that reads a typed day in the locale's order and opens the calendar on it.
 */
export function calendarConformance(adapter: Adapter) {
  const run = describe
  run('calendar', () => {
    const setup = async (props: Partial<CalendarProps> = {}) => {
      const values: Range[] = []
      const m = await adapter.calendar({ locale: 'en-GB', defaultValue: '2026-09-18', onValueChange: (value) => values.push(value), ...props }, freshTarget())
      const grid = () => part(m.root, 'calendar', 'grid')!
      const title = () => part(m.root, 'calendar', 'title')!.textContent
      const press = (name: string, init: KeyboardEventInit = {}) => adapter.act(() => void key(document.activeElement ?? grid(), name, init))
      return { m, grid, title, press, values }
    }

    it('is a grid named by its month, weekday heads named in full, six weeks, one tab stop on the chosen day', async () => {
      const { m, grid, title } = await setup()
      expect(grid().getAttribute('role')).toBe('grid')
      expect(title()).toBe('September 2026')
      expect(grid().getAttribute('aria-labelledby')).toBe(part(m.root, 'calendar', 'title')!.id)
      const heads = parts(m.root, 'calendar', 'weekday')
      expect(heads.map((head) => head.getAttribute('aria-label'))).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      expect(heads.every((head) => head.getAttribute('role') === 'columnheader')).toBe(true)
      expect(parts(m.root, 'calendar', 'week')).toHaveLength(6)
      const days = parts(m.root, 'calendar', 'day')
      expect(days).toHaveLength(42)
      expect(days.filter((day) => day.tabIndex === 0).map((day) => day.dataset.date)).toEqual(['2026-09-18'])
      const chosen = dayOf(m.root, '2026-09-18')
      expect(chosen.getAttribute('aria-selected')).toBe('true')
      expect(chosen.getAttribute('aria-label')).toBe('Friday, 18 September 2026')
      expect(chosen.textContent).toBe('18')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the keyboard walks the days into the next month, and Enter chooses', async () => {
      const { m, title, press, values } = await setup()
      await adapter.act(() => dayOf(m.root, '2026-09-18').focus())
      await press('ArrowDown')
      await press('ArrowDown')
      expect(document.activeElement).toBe(dayOf(m.root, '2026-10-02'))
      expect(title()).toBe('October 2026')
      await press('ArrowLeft')
      await press('Enter')
      expect(values).toEqual([{ start: '2026-10-01', end: null }])
      expect(dayOf(m.root, '2026-10-01').getAttribute('aria-selected')).toBe('true')
    })

    it('the month buttons turn the page and stop at the bounds', async () => {
      const { m, title } = await setup({ min: '2026-08-10', max: '2026-10-20' })
      const next = part(m.root, 'calendar', 'next') as HTMLButtonElement
      const prev = part(m.root, 'calendar', 'prev') as HTMLButtonElement
      expect(next.getAttribute('aria-label')).toBe('Next month')
      await adapter.act(() => click(next))
      expect(title()).toBe('October 2026')
      expect(next.disabled).toBe(true)
      await adapter.act(() => click(prev))
      await adapter.act(() => click(prev))
      expect(title()).toBe('August 2026')
      expect(prev.disabled).toBe(true)
      expect(dayOf(m.root, '2026-08-05').getAttribute('aria-disabled')).toBe('true')
    })

    it('a range: two presses in either order, the days between marked', async () => {
      const { m, values } = await setup({ mode: 'range', defaultValue: null })
      await adapter.act(() => click(dayOf(m.root, '2026-09-20')))
      await adapter.act(() => click(dayOf(m.root, '2026-09-14')))
      expect(values).toEqual([{ start: '2026-09-14', end: '2026-09-20' }])
      expect(dayOf(m.root, '2026-09-17').dataset.inRange).toBe('')
      expect(dayOf(m.root, '2026-09-14').dataset.rangeStart).toBe('')
      expect(dayOf(m.root, '2026-09-20').dataset.rangeEnd).toBe('')
      expect(part(m.root, 'calendar', 'grid')!.getAttribute('aria-multiselectable')).toBe('true')
    })
  })
}

export function datePickerConformance(adapter: Adapter) {
  const run = describe
  run('date picker', () => {
    const setup = async (props: Partial<DatePickerProps> = {}) => {
      const values: Range[] = []
      const m = await adapter.datePicker({ label: 'Due', locale: 'ru-RU', onValueChange: (value) => values.push(value), ...props }, freshTarget())
      const input = () => part(m.root, 'date-picker', 'input') as HTMLInputElement
      const trigger = () => part(m.root, 'date-picker', 'trigger') as HTMLButtonElement
      const content = () => part(m.root, 'date-picker', 'content')!
      const type = async (text: string) => {
        await adapter.act(() => setInputValue(input(), text))
        await adapter.act(() => void key(input(), 'Enter'))
      }
      return { m, input, trigger, content, type, values }
    }

    it('presets stand beside the calendar as buttons; one press chooses its range, closes, and the field says it', async () => {
      const presets = [
        { label: 'First week', value: { start: '2026-09-01', end: '2026-09-07' } },
        { label: 'Too early', value: { start: '2026-01-01', end: '2026-01-02' } },
      ]
      const { m, input, trigger, content, values } = await setup({ mode: 'range', min: '2026-06-01', presets, locale: 'en-GB' })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      const group = part(content(), 'date-picker', 'presets')!
      expect(group.getAttribute('role')).toBe('group')
      const buttons = parts(group, 'date-picker', 'preset') as HTMLButtonElement[]
      expect(buttons.map((button) => [button.textContent, button.disabled, button.getAttribute('aria-pressed')])).toEqual([
        ['First week', false, 'false'],
        ['Too early', true, 'false'],
      ])
      await adapter.act(() => click(buttons[0]))
      await adapter.wait(0)
      expect(values).toEqual([{ start: '2026-09-01', end: '2026-09-07' }])
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(input().value).toBe('1 Sept 2026 – 7 Sept 2026')
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      expect(part(m.root, 'date-picker', 'preset')!.getAttribute('aria-pressed')).toBe('true')
    })

    it('is a labelled field and a button that says it opens a dialog', async () => {
      const { m, input, trigger, content } = await setup()
      expect((part(m.root, 'date-picker', 'label') as HTMLLabelElement).htmlFor).toBe(input().id)
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-label')).toBe('Choose date')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)
      expect(content().getAttribute('role')).toBe('dialog')
      expect(input().placeholder).toBe('18.09.2026')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('reads a day typed in the locale’s order, shows it in the locale’s words, submits it as ISO', async () => {
      const { m, input, type, values } = await setup({ name: 'due' })
      await type('1.10.2026')
      expect(values).toEqual([{ start: '2026-10-01', end: null }])
      expect(input().value).toBe('1 окт. 2026 г.')
      expect(m.root.querySelector<HTMLInputElement>('input[type="hidden"][name="due"]')!.value).toBe('2026-10-01')
    })

    it('text that is not a day is marked, and the reason is tied to the field', async () => {
      const { m, input, type, values } = await setup()
      await type('someday')
      expect(input().getAttribute('aria-invalid')).toBe('true')
      const error = part(m.root, 'date-picker', 'error')!
      expect(error.textContent).toBe('Enter a date like 18.09.2026')
      expect(input().getAttribute('aria-describedby')).toBe(error.id)
      expect(values).toEqual([])
    })

    it('the button opens the calendar on the chosen day; choosing closes it and brings the focus back', async () => {
      const { m, input, trigger, values } = await setup({ defaultValue: '2026-07-04' })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(document.activeElement).toBe(dayOf(m.root, '2026-07-04'))
      await adapter.act(() => void key(document.activeElement!, 'ArrowRight'))
      expect(document.activeElement).toBe(dayOf(m.root, '2026-07-05'))
      await adapter.act(() => void key(document.activeElement!, 'Enter'))
      await adapter.wait(0)
      expect(values).toEqual([{ start: '2026-07-05', end: null }])
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(input())
    })

    it('Escape in the calendar closes it without choosing, and the focus goes back to the field', async () => {
      const { trigger, input, values } = await setup({ defaultValue: '2026-07-04' })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      await adapter.act(() => void key(document.activeElement!, 'Escape'))
      await adapter.wait(0)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(input())
      expect(values).toEqual([])
    })

    it('a range is typed as two days and submitted as an ISO interval', async () => {
      const { m, input, type, values } = await setup({ mode: 'range', locale: 'en-US', name: 'period' })
      await type('9/18/2026 – 9/1/2026')
      expect(values).toEqual([{ start: '2026-09-01', end: '2026-09-18' }])
      expect(input().value).toBe('Sep 1, 2026 – Sep 18, 2026')
      expect(m.root.querySelector<HTMLInputElement>('input[type="hidden"][name="period"]')!.value).toBe('2026-09-01/2026-09-18')
    })
  })
}
