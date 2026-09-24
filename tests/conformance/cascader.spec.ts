import { describe, expect, it } from 'vitest'
import { type Adapter, type CascaderProps, click, freshTarget, part, parts } from './harness'
import { places } from './places'

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))

/**
 * The cascader in each framework: a button naming the chosen path, a dialog
 * of columns the keyboard walks down and across, the focus going in and
 * coming back, and the leaf's value in the form.
 */
export function cascaderConformance(adapter: Adapter) {
  const run = describe
  run('cascader', () => {
    const setup = async (props: Partial<CascaderProps> = {}) => {
      const changes: string[][] = []
      const m = await adapter.cascader({ label: 'Place', items: places, onValueChange: (value) => changes.push(value), ...props }, freshTarget())
      const trigger = () => part(m.root, 'cascader', 'trigger') as HTMLButtonElement
      const content = () => part(m.root, 'cascader', 'content')!
      const columns = () => parts(m.root, 'cascader', 'column')
      const focusedText = () => (document.activeElement ? part(document.activeElement, 'cascader', 'item-text')?.textContent : undefined)
      const press = (name: string) => adapter.act(() => void key(document.activeElement!, name))
      return { m, trigger, content, columns, focusedText, press, changes }
    }

    it('is a button named by its label and its path, opening a dialog', async () => {
      const { m, trigger, content } = await setup({ defaultValue: ['ru', 'tat', 'kzn'] })
      expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)
      const [labelId, valueId] = trigger().getAttribute('aria-labelledby')!.split(' ')
      expect(document.getElementById(labelId)!.textContent).toBe('Place')
      expect(document.getElementById(valueId)!.textContent).toBe('RussiaTatarstanKazan')
      expect(content().getAttribute('role')).toBe('dialog')
      expect(parts(m.root, 'cascader', 'separator')).toHaveLength(2)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('opens on the first item; the keyboard walks down a column and into the children', async () => {
      const { trigger, columns, focusedText, press } = await setup()
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(focusedText()).toBe('Russia')
      expect(columns().map((column) => column.getAttribute('role'))).toEqual(['listbox', 'listbox'])
      expect(columns()[1].getAttribute('aria-label')).toBe('Russia')
      await press('ArrowRight')
      expect(focusedText()).toBe('Moscow')
      await press('ArrowDown')
      expect(focusedText()).toBe('Tatarstan')
      expect(columns()).toHaveLength(3)
      await press('ArrowRight')
      expect(focusedText()).toBe('Kazan')
      await press('ArrowLeft')
      expect(focusedText()).toBe('Tatarstan')
      expect(columns()).toHaveLength(3)
    })

    it('walking the columns never sends the focus back to the button on the way', async () => {
      const { trigger, press } = await setup()
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      let visits = 0
      trigger().addEventListener('focus', () => visits++)
      await press('ArrowDown')
      await press('ArrowRight')
      await press('ArrowDown')
      await adapter.wait(0)
      expect(visits).toBe(0)
    })

    it('Enter on a leaf chooses the path, closes, and gives the focus back to the button', async () => {
      const { m, trigger, press, changes } = await setup({ name: 'place' })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      await press('ArrowDown')
      await press('ArrowRight')
      await press('Enter')
      await adapter.wait(0)
      expect(changes).toEqual([['kz', 'ala']])
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger())
      expect(m.root.querySelector<HTMLInputElement>('input[type="hidden"][name="place"]')!.value).toBe('ala')
    })

    it('a press on a branch opens it; a press on a leaf chooses', async () => {
      const { m, trigger, changes } = await setup()
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      const item = (text: string) => parts(m.root, 'cascader', 'item').find((row) => part(row, 'cascader', 'item-text')!.textContent === text)!
      await adapter.act(() => click(item('Tatarstan')))
      expect(changes).toEqual([])
      await adapter.act(() => click(item('Naberezhnye Chelny')))
      expect(changes).toEqual([['ru', 'tat', 'chelny']])
    })

    it('when a branch may be chosen, a press on its chevron only opens it — the way on a touch screen', async () => {
      const { m, trigger, columns, changes } = await setup({ selectParents: true })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      const row = (text: string) => parts(m.root, 'cascader', 'item').find((item) => part(item, 'cascader', 'item-text')!.textContent === text)!
      await adapter.act(() => click(part(row('Kazakhstan'), 'cascader', 'item-branch')!))
      expect(changes).toEqual([])
      expect(columns()[1].getAttribute('aria-label')).toBe('Kazakhstan')
      await adapter.act(() => click(row('Kazakhstan')))
      expect(changes).toEqual([['kz']])
    })

    it('Escape closes without choosing, and the focus goes back to the button', async () => {
      const { trigger, changes } = await setup()
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      await adapter.act(() => void key(document.activeElement!, 'Escape'))
      await adapter.wait(0)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(trigger())
      expect(changes).toEqual([])
    })

    it('a disabled item is passed over and cannot be chosen', async () => {
      const { m, trigger, focusedText, press } = await setup({ defaultValue: ['ru', 'tat'] })
      await adapter.act(() => click(trigger()))
      await adapter.wait(0)
      expect(focusedText()).toBe('Tatarstan')
      await press('ArrowDown')
      expect(focusedText()).toBe('Samara')
      const petersburg = parts(m.root, 'cascader', 'item').find((row) => row.textContent?.includes('Saint Petersburg'))!
      expect(petersburg.getAttribute('aria-disabled')).toBe('true')
    })
  })
}
