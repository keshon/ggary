import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

const items = [
  { value: '{{name}}', hint: 'The name of the monitor' },
  { value: '{{status}}' },
  { value: '{{error}}', label: 'error' },
]

/**
 * Inserts: real buttons in a named group, and a press that lands at the caret
 * of the field, gives focus back and tells the field it changed. A controlled
 * React field is the browser test's (tests/inserts.browser.test.ts).
 */
export function insertsConformance(adapter: Adapter) {
  const mount = adapter.inserts
  ;describe('inserts', () => {
    const setup = async (props: Partial<Parameters<NonNullable<Adapter['inserts']>>[0]> = {}) => {
      const target = freshTarget()
      const field = document.createElement('textarea')
      field.id = `tpl-${Math.random().toString(36).slice(2)}`
      field.value = '{{name}} has failed'
      target.append(field)
      const m = await mount({ items, target: field.id, ...props }, target)
      const button = (label: string) => parts(m.root, 'inserts', 'item').find((b) => b.textContent === label)!
      return { m, field, button }
    }

    it('is a named group of real buttons, each showing its value unless labelled', async () => {
      const { m } = await setup({ label: 'Variables' })
      const root = part(m.root, 'inserts', 'root')!
      expect(root.getAttribute('role')).toBe('group')
      expect(root.getAttribute('aria-label')).toBe('Variables')
      const buttons = parts(m.root, 'inserts', 'item') as HTMLButtonElement[]
      expect(buttons.map((b) => b.textContent)).toEqual(['{{name}}', '{{status}}', 'error'])
      expect(buttons.every((b) => b.tagName === 'BUTTON' && b.type === 'button')).toBe(true)
      expect(buttons[0].title).toBe('The name of the monitor')
      expect(buttons[1].hasAttribute('title')).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('a press inserts at the caret, replacing a selection, the caret after it, focus in the field', async () => {
      const { field, button } = await setup()
      const heard = vi.fn()
      field.addEventListener('input', heard)
      // "{{name}} |has failed": the caret after the space.
      field.setSelectionRange(9, 9)
      await adapter.act(() => click(button('{{status}}')))
      expect(field.value).toBe('{{name}} {{status}}has failed')
      expect(field.selectionStart).toBe(19)
      expect(field.selectionEnd).toBe(19)
      expect(document.activeElement).toBe(field)
      expect(heard).toHaveBeenCalledOnce()

      // "has" selected, then replaced.
      field.setSelectionRange(19, 22)
      await adapter.act(() => click(button('error')))
      expect(field.value).toBe('{{name}} {{status}}{{error}} failed')
      expect(field.selectionStart).toBe(28)
    })

    it('onInsert returning false leaves the field untouched; a getter can name the field', async () => {
      const onInsert = vi.fn(() => false as const)
      const { field, button, m } = await setup({ onInsert })
      field.setSelectionRange(0, 0)
      await adapter.act(() => click(button('{{name}}')))
      expect(onInsert).toHaveBeenCalledWith('{{name}}', field)
      expect(field.value).toBe('{{name}} has failed')

      await m.update({ onInsert: undefined, target: () => field })
      field.setSelectionRange(field.value.length, field.value.length)
      await adapter.act(() => click(button('{{name}}')))
      expect(field.value).toBe('{{name}} has failed{{name}}')
    })
  })
}
