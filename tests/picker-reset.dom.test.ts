import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DatePicker } from '../packages/react/src/components/date-picker/DatePicker'
import { TimePicker } from '../packages/react/src/components/time-picker/TimePicker'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function type(input: HTMLInputElement, text: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
  })
}

describe('picker form reset', () => {
  for (const kind of ['date', 'time'] as const) {
    it.each([false, true])(`${kind}: clears a draft without changing controlled ownership (%s)`, async controlled => {
      const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
      const change = vi.fn()
      const initial = kind === 'date' ? '2026-09-18' : '14:30'
      const latest = kind === 'date' ? '2026-09-20' : '16:45'
      const render = async (value: string) => act(async () => {
        const props = { name: 'choice', locale: 'en-US', onValueChange: change, ...(controlled ? { value } : { defaultValue: value }) }
        root!.render(kind === 'date' ? h(DatePicker, props) : h(TimePicker, props)); await settle()
      })
      await render(initial)
      const input = form.querySelector<HTMLInputElement>('input[type="text"]')!
      const originalText = input.value
      await type(input, 'invalid draft')
      expect(input.value).toBe('invalid draft')
      await render(latest)
      change.mockClear()
      await act(async () => { form.reset(); await settle() })
      expect(new FormData(form).get('choice')).toBe(latest)
      expect(input.value).not.toBe('invalid draft')
      expect(input.value).not.toBe(originalText)
      expect(input.getAttribute('aria-invalid')).not.toBe('true')
      expect(input.getAttribute('aria-expanded')).not.toBe('true')
      expect(change).not.toHaveBeenCalled()
    })
  }
  it('DateTime resets both halves to the latest default, with one submitted value', async () => {
    const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
    const change = vi.fn()
    const render = async (defaultValue: string) => act(async () => {
      root!.render(h(DatePicker, { time: true, name: 'appointment', defaultValue, onValueChange: change, locale: 'en-US' })); await settle()
    })
    await render('2026-09-18T14:30')
    for (const input of form.querySelectorAll<HTMLInputElement>('input[type="text"]')) await type(input, 'invalid draft')
    await render('2026-09-20T16:45')
    change.mockClear()
    await act(async () => { form.reset(); await settle() })
    expect(new FormData(form).getAll('appointment')).toEqual(['2026-09-20T16:45'])
    for (const input of form.querySelectorAll<HTMLInputElement>('input[type="text"]')) expect(input.value).not.toBe('invalid draft')
    expect(change).not.toHaveBeenCalled()
  })
})
