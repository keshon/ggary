import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Select as BaseSelect } from '../packages/react/src/components/select/Select'
import { Form, FormSummary } from '../packages/react/src/components/form/Form'
import { Field } from '../packages/react/src/components/field/Field'
import { Fieldset } from '../packages/react/src/components/fieldset/Fieldset'
import type { SelectProps } from '../packages/react/src/components/select/Select'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.replaceChildren() })
const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }]
async function mount(props: Partial<SelectProps> = {}) {
  const form = document.createElement('form')
  document.body.append(form)
  root = createRoot(form)
  const render = async (next: Partial<SelectProps>) => {
    await act(async () => root!.render(createElement(BaseSelect, { items, label: 'Framework', name: 'framework', ...props, ...next })))
  }
  await render({})
  return { form, render, trigger: () => form.querySelector<HTMLButtonElement>('[data-part="trigger"]')! }
}
describe('BaseSelect public contract', () => {
  it('opens a listbox with the expected options', async () => {
    const m = await mount()
    await act(async () => { m.trigger().focus(); m.trigger().click() })
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(2)
  })
  it('submits the value and updates controlled props without echoing a callback', async () => {
    const changed = vi.fn()
    const m = await mount({ value: 'a', onValueChange: changed })
    expect(new FormData(m.form).get('framework')).toBe('a')
    await m.render({ value: 'b' })
    expect(m.trigger().textContent).toContain('Bravo')
    expect(new FormData(m.form).get('framework')).toBe('b')
    expect(changed).not.toHaveBeenCalled()
  })
  it('disabled controls neither open nor participate in submission', async () => {
    const m = await mount({ defaultValue: 'a', disabled: true })
    expect(m.trigger().disabled).toBe(true)
    await act(async () => m.trigger().click())
    expect(m.trigger().getAttribute('aria-expanded')).toBe('false')
    expect(new FormData(m.form).has('framework')).toBe(false)
  })
  it('a native form reset cannot overwrite the controlled owner value', async () => {
    const changed = vi.fn()
    const m = await mount({ value: 'b', defaultValue: 'a', onValueChange: changed })
    await act(async () => { m.form.reset(); await new Promise((resolve) => setTimeout(resolve, 10)) })
    expect(m.trigger().textContent).toContain('Bravo')
    expect(new FormData(m.form).get('framework')).toBe('b')
    expect(changed).not.toHaveBeenCalled()
  })
  it('keeps an uncontrolled value on rerender, then resets to the latest default without callbacks', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: 'a', onValueChange: changed })
    await m.render({ defaultValue: 'b' })
    expect(new FormData(m.form).get('framework')).toBe('a')
    await act(async () => { m.form.reset(); await new Promise((resolve) => setTimeout(resolve, 10)) })
    expect(new FormData(m.form).get('framework')).toBe('b')
    expect(m.trigger().textContent).toContain('Bravo')
    expect(changed).not.toHaveBeenCalled()
  })
  it('renders controlled null as a placeholder and an empty form value', async () => {
    const m = await mount({ value: null, placeholder: 'Choose' })
    expect(m.trigger().textContent).toContain('Choose')
    expect(new FormData(m.form).get('framework')).toBe('')
    await m.render({ value: 'b' })
    await m.render({ value: null })
    expect(m.trigger().textContent).toContain('Choose')
    await m.render({ value: 'missing' })
    expect(m.trigger().textContent).toContain('Choose')
    expect(new FormData(m.form).get('framework')).toBe('missing')
  })
})


describe('Select Field composition', () => {
  async function mountField(extra: { required?: boolean; disabled?: boolean; readOnly?: boolean } = {}, selected: string | null = null) {
    const form = document.createElement('form')
    document.body.append(form)
    root = createRoot(form)
    await act(async () => root!.render(createElement(Field, { name: 'framework', label: 'Framework', ...extra,
      children: createElement(BaseSelect, { items, value: selected }) })))
    return { form, trigger: form.querySelector<HTMLButtonElement>('[data-part="trigger"]')! }
  }
  it('inherits the name once and connects the Field label to the visible trigger', async () => {
    const m = await mountField({}, 'b')
    expect(new FormData(m.form).getAll('framework')).toEqual(['b'])
    expect(m.form.querySelector('label')!.htmlFor).toBe(m.trigger.id)
    expect(m.trigger.getAttribute('aria-labelledby')).toBe(m.form.querySelector('label')!.id)
  })
  it('uses native required validity and reveals the Field error on invalid', async () => {
    const m = await mountField({ required: true })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(m.form.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(false)
  })
  it('does not reveal an untouched required error while focus moves into its popup', async () => {
    const m = await mountField({ required: true })
    await act(async () => { m.trigger.focus(); m.trigger.click() })
    expect(m.form.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(true)
  })
  it('inherits disabled and excludes the selected value from submission', async () => {
    const m = await mountField({ disabled: true }, 'a')
    expect(m.trigger.disabled).toBe(true)
    expect(new FormData(m.form).has('framework')).toBe(false)
  })
  it('read-only permits browsing but refuses selection and preserves submission', async () => {
    const m = await mountField({ readOnly: true }, 'a')
    await act(async () => m.trigger.click())
    const options = document.querySelectorAll<HTMLElement>('[role="option"]')
    expect(options).toHaveLength(2)
    await act(async () => { options[1].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); options[1].click() })
    expect(new FormData(m.form).getAll('framework')).toEqual(['a'])
  })
  it('inherits a disabled Fieldset outside Field', async () => {
    const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
    await act(async () => root!.render(createElement(Fieldset, { disabled: true,
      children: createElement(BaseSelect, { items, name: 'framework', defaultValue: 'a' }) })))
    expect(form.querySelector<HTMLButtonElement>('[data-part="trigger"]')!.disabled).toBe(true)
    expect(new FormData(form).has('framework')).toBe(false)
  })
})

describe('Select Form error ownership', () => {
  it.each([false, true])('only clears a server error after an accepted value change (controlled refusal: %s)', async refused => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    await act(async () => root!.render(createElement(Form, { onSubmit: () => ({ errors: { framework: 'Unavailable framework' } }),
      children: [createElement(FormSummary, { key: 'summary' }),
        createElement(Field, { key: 'field', name: 'framework', label: 'Framework', children:
          createElement(BaseSelect, { items, ...(refused ? { value: 'a' } : { defaultValue: 'a' }) }) }),
        createElement('button', { key: 'save', type: 'submit' }, 'Save')] })))
    const form = host.querySelector('form')!
    await act(async () => { form.requestSubmit(); await new Promise(resolve => setTimeout(resolve, 20)) })
    expect(host.querySelectorAll('a')).toHaveLength(1)
    expect(host.querySelector('[data-scope="field"][data-part="error"]')!.textContent).toBe('Unavailable framework')
    await act(async () => host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!.click())
    await act(async () => { const option = document.querySelectorAll<HTMLElement>('[role="option"]')[1]; option.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' })); option.click(); await new Promise(resolve => setTimeout(resolve, 20)) })
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)) })
    expect(new FormData(form).getAll('framework')).toEqual([refused ? 'a' : 'b'])
    expect(host.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(!refused)
    expect(host.querySelectorAll('a')).toHaveLength(refused ? 1 : 0)
  })
})
