import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DatePicker, TimePicker, Field, Form, FormSummary } from '../packages/react/src/index'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 60))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function type(input: HTMLInputElement, text: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text); input.dispatchEvent(new Event('input', { bubbles: true })); await settle() })
  await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
}
describe('picker Form workflow integration', () => {
  for (const kind of ['date', 'time'] as const) {
    it.each([false, true])(`${kind}: server errors clear only after accepted edits (controlled refusal: %s)`, async refused => {
      const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
      const onSubmit = vi.fn(() => ({ errors: { choice: 'Server rejected this choice' } }))
      const onValueChange = vi.fn()
      await act(async () => {
        const picker = kind === 'date'
          ? h(DatePicker, { locale: 'en-GB', onValueChange, ...(refused ? { value: '2026-10-14' } : { defaultValue: '2026-10-14' }) })
          : h(TimePicker, { locale: 'en-GB', onValueChange, ...(refused ? { value: '14:30' } : { defaultValue: '14:30' }) })
        root!.render(h(Form, { onSubmit, children: [h(FormSummary, { key: 'summary' }), h(Field, { key: 'field', name: 'choice', label: 'Choice', children: picker }), h('button', { key: 'submit', type: 'submit' }, 'Save')] })); await settle()
      })
      await act(async () => { host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click(); await settle() })
      expect(onSubmit).toHaveBeenCalledOnce()
      const summary = host.querySelector<HTMLElement>('[data-scope="form-summary"][data-part="root"]')!
      expect(summary.textContent).toContain('Choice: Server rejected this choice')
      const editor = host.querySelector<HTMLInputElement>(`[data-scope="${kind}-picker"][data-part="input"]`)!
      await act(async () => { summary.querySelector<HTMLAnchorElement>('a')!.click(); await settle() })
      expect(document.activeElement).toBe(editor)
      await type(editor, kind === 'date' ? '2026-10-20' : '16:45')
      const error = host.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!
      expect(onValueChange).toHaveBeenCalledOnce()
      if (refused) {
        expect(error.textContent).toBe('Server rejected this choice')
        expect(new FormData(host.querySelector('form')!).get('choice')).toBe(kind === 'date' ? '2026-10-14' : '14:30')
      } else expect(error.hidden).toBe(true)
      await act(async () => { host.querySelector('form')!.reset(); await settle() })
      expect(error.hidden).toBe(true)
    })
  }
})
