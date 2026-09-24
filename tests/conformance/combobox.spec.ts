import { describe, expect, it } from 'vitest'
import type { ComboboxItem } from '../../packages/core/src/components/combobox'
import { setInputValue } from '../../packages/core/src/index'
import { type Adapter, type ComboboxProps, click, freshTarget, part, parts } from './harness'

const managers: ComboboxItem[] = [
  { value: 'alexey', label: 'Alexey Kuznetsov', description: 'Moscow' },
  { value: 'daria', label: 'Daria Morozova', description: 'Kazan' },
  { value: 'nikita', label: 'Nikita Smirnov', description: 'Moscow' },
  { value: 'polina', label: 'Polina Volkova', description: 'Samara', disabled: true },
  { value: 'roman', label: 'Roman Titov', description: 'Kazan' },
]

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))

/**
 * The combobox in each framework: a field that keeps the focus, a list named
 * by aria-activedescendant, choosing by keyboard and by pointer, several
 * values as chips, a server list, and the form.
 */
export function comboboxConformance(adapter: Adapter) {
  const run = describe
  run('combobox', () => {
    const setup = async (props: Partial<ComboboxProps> = {}) => {
      const changes: string[][] = []
      const m = await adapter.combobox({ label: 'Manager', items: managers, onValueChange: (value) => changes.push(value), ...props }, freshTarget())
      const input = () => part(m.root, 'combobox', 'input') as HTMLInputElement
      const content = () => part(m.root, 'combobox', 'content')!
      const options = () => parts(m.root, 'combobox', 'item')
      const texts = () => options().map((option) => part(option, 'combobox', 'item-text')!.textContent)
      const type = (text: string) => adapter.act(() => setInputValue(input(), text))
      const press = (name: string, init: KeyboardEventInit = {}) => adapter.act(() => void key(input(), name, init))
      return { m, input, content, options, texts, type, press, changes }
    }

    it('is a combobox field named by its label, controlling a listbox, with a live status', async () => {
      const { m, input, content } = await setup()
      const field = input()
      expect(field.getAttribute('role')).toBe('combobox')
      expect(field.getAttribute('aria-autocomplete')).toBe('list')
      expect(field.getAttribute('aria-expanded')).toBe('false')
      expect(field.getAttribute('aria-controls')).toBe(content().id)
      expect(content().getAttribute('role')).toBe('listbox')
      const label = part(m.root, 'combobox', 'label') as HTMLLabelElement
      expect(label.htmlFor).toBe(field.id)
      const status = part(m.root, 'combobox', 'status')!
      expect(status.getAttribute('role')).toBe('status')
      expect(field.getAttribute('aria-describedby')).toBe(status.id)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('typing narrows the list and highlights the best match; Enter chooses it', async () => {
      const { input, texts, type, press, changes } = await setup()
      input().focus()
      await type('mo')
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(texts()).toEqual(['Daria Morozova', 'Alexey Kuznetsov', 'Nikita Smirnov'])
      const highlighted = document.getElementById(input().getAttribute('aria-activedescendant')!)!
      expect(part(highlighted, 'combobox', 'item-text')!.textContent).toBe('Daria Morozova')
      await press('Enter')
      expect(changes).toEqual([['daria']])
      expect(input().value).toBe('Daria Morozova')
      expect(input().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(input())
    })

    it('text that matches nothing can be created: "Create …" ends the list, and Enter chooses what the owner makes', async () => {
      const { m, input, options, texts, type, press, changes } = await setup({ onCreate: (text) => ({ value: `new:${text}`, label: text }) })
      input().focus()
      await type('dar')
      expect(texts()).toEqual(['Daria Morozova', 'Create “dar”'])
      expect(options()[1].hasAttribute('data-create')).toBe(true)
      await type('Zinaida P.')
      expect(texts()).toEqual(['Create “Zinaida P.”'])
      expect(part(m.root, 'combobox', 'status')!.textContent).toBe('Nothing matches. Enter creates “Zinaida P.”.')
      await press('Enter')
      await adapter.wait(10)
      expect(changes).toEqual([['new:Zinaida P.']])
      expect(input().value).toBe('Zinaida P.')
      expect(input().getAttribute('aria-expanded')).toBe('false')
    })

    it('arrows open the list and walk it, skipping what is disabled; Escape closes it', async () => {
      const { input, press, options } = await setup()
      input().focus()
      await press('ArrowDown')
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id)
      await press('ArrowDown')
      await press('ArrowDown')
      await press('ArrowDown')
      // Polina is disabled: the highlight goes past her.
      expect(input().getAttribute('aria-activedescendant')).toBe(options()[4].id)
      expect(options()[3].getAttribute('aria-disabled')).toBe('true')
      await press('Escape')
      expect(input().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(input())
    })

    it('a press on an option chooses it, and the field keeps the focus', async () => {
      const { input, content, options, changes } = await setup()
      input().focus()
      await adapter.act(() => click(input()))
      const down = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
      options()[1].dispatchEvent(down)
      // Cancelled, so the field does not lose the focus to the list.
      expect(down.defaultPrevented).toBe(true)
      expect(content().contains(document.activeElement)).toBe(false)
      await adapter.act(() => click(options()[1]))
      expect(changes).toEqual([['daria']])
      expect(input().value).toBe('Daria Morozova')
    })

    it('leaving without choosing puts the field back to the choice', async () => {
      const { input, type } = await setup({ defaultValue: 'roman' })
      expect(input().value).toBe('Roman Titov')
      input().focus()
      await type('nik')
      await adapter.act(() => void input().dispatchEvent(new FocusEvent('blur')))
      await adapter.act(() => void input().dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
      expect(input().value).toBe('Roman Titov')
    })

    it('several values: chips in the field, each with a named remove, and Backspace takes the last', async () => {
      const { m, input, type, press, changes, content } = await setup({ multiple: true, defaultValue: ['daria'] })
      expect(content().getAttribute('aria-multiselectable')).toBe('true')
      const chips = () => parts(m.root, 'combobox', 'chip').map((chip) => part(chip, 'combobox', 'chip-text')!.textContent)
      expect(chips()).toEqual(['Daria Morozova'])
      input().focus()
      await type('rom')
      await press('Enter')
      expect(chips()).toEqual(['Daria Morozova', 'Roman Titov'])
      // The list stays open for the next one, and the query is gone.
      expect(input().getAttribute('aria-expanded')).toBe('true')
      expect(input().value).toBe('')
      const remove = part(parts(m.root, 'combobox', 'chip')[0], 'combobox', 'chip-remove') as HTMLButtonElement
      expect(remove.getAttribute('aria-label')).toBe('Remove Daria Morozova')
      expect(remove.tabIndex).toBe(-1)
      await adapter.act(() => click(remove))
      expect(chips()).toEqual(['Roman Titov'])
      await press('Backspace')
      expect(chips()).toEqual([])
      expect(changes).toEqual([['daria', 'roman'], ['roman'], []])
    })

    it('a server list: asked when the typing settles, its answer shown and highlighted', async () => {
      const asked: string[] = []
      const load = async (query: string) => {
        asked.push(query)
        return managers.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
      }
      const { input, texts, type } = await setup({ items: undefined, load, debounce: 20 })
      input().focus()
      await type('ro')
      await adapter.wait(60)
      expect(asked.at(-1)).toBe('ro')
      expect(texts()).toEqual(['Daria Morozova', 'Roman Titov'])
      expect(input().getAttribute('aria-activedescendant')).toBeTruthy()
    })

    it('a long list draws a limit and says how many there are', async () => {
      const many = Array.from({ length: 120 }, (_, i) => ({ value: `c${i}`, label: `Company ${i}` }))
      const { m, input, options, type } = await setup({ items: many, limit: 20 })
      input().focus()
      await type('comp')
      expect(options()).toHaveLength(20)
      expect(part(m.root, 'combobox', 'more')!.textContent).toBe('Showing 20 of 120 — type to narrow')
    })

    it('submits its value with a form, one input per value', async () => {
      const { m } = await setup({ multiple: true, name: 'managers', defaultValue: ['daria', 'roman'] })
      const hidden = [...m.root.querySelectorAll<HTMLInputElement>('input[type="hidden"][name="managers"]')].map((field) => field.value)
      expect(hidden).toEqual(['daria', 'roman'])
    })
  })
}
