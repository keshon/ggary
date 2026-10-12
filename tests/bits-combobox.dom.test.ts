import { afterEach, expect, it, vi } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import Combobox from '../packages/svelte/src/components/combobox/Combobox.svelte'
import { click } from './conformance/harness'
import { reactiveProps } from './conformance/adapters/svelte-props.svelte'
import type { ComboboxItem } from '../packages/core/src/components/combobox'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { flushSync(); await new Promise(resolve => setTimeout(resolve, 30)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
async function setup(props: Record<string, unknown>) {
  const form = document.createElement('form'); document.body.append(form)
  const owner = reactiveProps(props)
  instance = mount(Combobox, { target: form, props: owner }); await settle()
  const input = form.querySelector<HTMLInputElement>('[data-part="input"]')!
  return { form, input, owner, type: async (text: string) => { input.value = text; input.dispatchEvent(new InputEvent('input', { bubbles: true })); await settle() } }
}
it('aborts obsolete searches and ignores answers from a loader that ignores abort', async () => {
  const requests: { query: string; signal: AbortSignal; resolve: (items: ComboboxItem[]) => void }[] = []
  const { type, input } = await setup({ debounce: 0, load: (query: string, signal: AbortSignal) => new Promise<ComboboxItem[]>(resolve => requests.push({ query, signal, resolve })) })
  await type('old'); await type('new')
  const old = requests.find(request => request.query === 'old')!
  const current = requests.find(request => request.query === 'new')!
  expect(old.signal.aborted).toBe(true)
  current.resolve([{ value: 'new', label: 'Fresh result' }]); await settle()
  old.resolve([{ value: 'old', label: 'Obsolete result' }]); await settle()
  expect(document.querySelector('[role="listbox"]')!.textContent).toContain('Fresh result')
  expect(document.querySelector('[role="listbox"]')!.textContent).not.toContain('Obsolete result')
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await settle()
  expect(current.signal.aborted).toBe(true)
  expect(input.getAttribute('aria-expanded')).toBe('false')
})
it('does not apply a creation result after form reset', async () => {
  let finish!: (item: ComboboxItem) => void
  const changed = vi.fn()
  const { form, type } = await setup({ items: [], name: 'choice', onValueChange: changed, onCreate: () => new Promise<ComboboxItem>(resolve => finish = resolve) })
  await type('New company')
  click(document.querySelector('[role="option"]')!); await settle()
  expect(document.querySelector('[data-part="status"]')!.textContent).toContain('Creating')
  form.reset(); await settle()
  finish({ value: 'new', label: 'New company' }); await settle()
  expect(changed).not.toHaveBeenCalled()
  expect(new FormData(form).getAll('choice')).toEqual([])
})
it('retains remote selected labels and never submits the search text', async () => {
  const { form, type, input } = await setup({ name: 'choice', debounce: 0, load: async (query: string) => query === 'one' ? [{ value: '1', label: 'One company' }] : [] })
  await type('one'); await settle()
  click(document.querySelector('[role="option"]')!); await settle()
  expect(input.value).toBe('One company')
  await type('unmatched'); await settle()
  input.dispatchEvent(new FocusEvent('blur')); await settle()
  expect(input.value).toBe('One company')
  expect(new FormData(form).getAll('choice')).toEqual(['1'])
})
it('accepts empty-string item keys and dynamic items without echoing owner updates', async () => {
  const changed = vi.fn()
  const { input, owner, type } = await setup({ items: [], onValueChange: changed })
  owner.items = [{ value: '', label: 'Empty key' }]; await settle()
  await type('Empty')
  click(document.querySelector('[role="option"]')!); await settle()
  expect(changed).toHaveBeenCalledWith([''], [expect.objectContaining({ value: '' })])
  expect(input.value).toBe('Empty key')
  owner.value = null; await settle()
  expect(input.value).toBe('')
  expect(changed).toHaveBeenCalledTimes(1)
})
