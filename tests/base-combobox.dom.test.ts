import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Combobox, type ComboboxProps } from '../packages/react/src/components/combobox/Combobox'
import { Field } from '../packages/react/src/components/field/Field'
import { Fieldset } from '../packages/react/src/components/fieldset/Fieldset'
import { Form, FormSummary } from '../packages/react/src/components/form/Form'
import { Dialog } from '../packages/react/src/components/dialog/Dialog'
import { setInputValue, openLayerCount } from '@ggary/core'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = (ms = 40) => new Promise(r => setTimeout(r, ms))
const input = () => document.querySelector<HTMLInputElement>('[data-scope="combobox"][data-part="input"]')!
const options = () => [...document.querySelectorAll<HTMLElement>('[data-scope="combobox"][data-part="item"]')]
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined
  expect(openLayerCount()).toBe(0)
  document.body.replaceChildren()
})
async function mount(props: Partial<ComboboxProps> = {}, hosted = false) {
  const form = document.createElement('form')
  document.body.append(form)
  root = createRoot(form)
  const render = async (next: Partial<ComboboxProps> = {}) => act(async () => {
    const child = h(Combobox, { label: 'Company', name: 'company', items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }], ...props, ...next })
    root!.render(hosted ? h(Dialog, { defaultOpen: true, title: 'Host' }, child) : child)
    await settle()
  })
  await render()
  return { form, render }
}
const type = (text: string) => act(async () => { input().focus(); setInputValue(input(), text); await settle() })
const pick = (index = 0) => act(async () => { options()[index].click(); await settle() })

describe('Combobox public Base UI integration', () => {
  it('controlled refusal keeps the choice, and owner updates emit no callback', async () => {
    const changed = vi.fn()
    const m = await mount({ value: 'a', onValueChange: changed })
    await type('Br')
    await pick()
    expect(changed).toHaveBeenCalledExactlyOnceWith(['b'], [{ value: 'b', label: 'Bravo' }])
    expect(input().value).toBe('Alpha')
    expect(new FormData(m.form).get('company')).toBe('a')
    await m.render({ value: 'b' })
    expect(input().value).toBe('Bravo')
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('aborts older searches and ignores late answers even when the server ignores abort', async () => {
    const pending: { query: string; signal: AbortSignal; resolve: (items: { value: string; label: string }[]) => void }[] = []
    await mount({ debounce: 0, load: (query, signal) => new Promise(resolve => pending.push({ query, signal, resolve })) })
    await type('old')
    await act(async () => { await settle() })
    await type('new')
    await act(async () => { await settle() })
    const old = pending.find(p => p.query === 'old')!
    const latest = pending.find(p => p.query === 'new')!
    expect(old.signal.aborted).toBe(true)
    await act(async () => { latest.resolve([{ value: 'n', label: 'New answer' }]); await settle() })
    await act(async () => { old.resolve([{ value: 'o', label: 'Old answer' }]); await settle() })
    expect(options().map(x => x.textContent)).toEqual(['New answer'])
  })
  it('minimum length suppresses requests; remote labels survive subsequent results', async () => {
    const load = vi.fn(async (q: string) => [{ value: q, label: `Company ${q}` }])
    await mount({ load, debounce: 0, minLength: 2 })
    await type('a')
    expect(load).not.toHaveBeenCalled()
    await type('ab')
    await act(async () => { await settle() })
    await pick()
    expect(input().value).toBe('Company ab')
    await type('cd')
    await act(async () => { await settle() })
    await act(async () => { input().blur(); await settle() })
    expect(input().value).toBe('Company ab')
  })
  it('creation rejects visibly and can be retried without changing the selected value', async () => {
    const create = vi.fn().mockRejectedValueOnce(new Error('Already exists')).mockResolvedValueOnce({ value: 'z', label: 'Zebra' })
    const changed = vi.fn()
    await mount({ onCreate: create, onValueChange: changed })
    await type('Zebra')
    await pick()
    expect(document.querySelector('[data-part="status"]')?.textContent).toBe('Could not create: Already exists')
    expect(changed).not.toHaveBeenCalled()
    await pick()
    expect(changed).toHaveBeenCalledExactlyOnceWith(['z'], [{ value: 'z', label: 'Zebra' }])
    expect(input().value).toBe('Zebra')
  })
  it('reset uses the latest default without callback; disabled choices do not submit', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: 'a', onValueChange: changed })
    await m.render({ defaultValue: 'b' })
    await act(async () => { m.form.reset(); await settle() })
    expect(input().value).toBe('Bravo')
    expect(changed).not.toHaveBeenCalled()
    await m.render({ disabled: true })
    expect(new FormData(m.form).has('company')).toBe(false)
  })
  it('Escape closes the hosted list before its parent Dialog', async () => {
    await mount({}, true)
    await type('Al')
    expect(options()[0].closest('[data-scope="dialog"][data-part="layer"]')).not.toBeNull()
    await act(async () => {
      input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      await settle()
    })
    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[data-scope="dialog"][data-part="content"]')?.getAttribute('data-state')).toBe('open')
    expect(document.activeElement).toBe(input())
  })
  it('a pending creation cannot overwrite a native form reset', async () => {
    let resolve!: (item: { value: string; label: string }) => void
    const changed = vi.fn()
    const m = await mount({ defaultValue: 'a', onValueChange: changed, onCreate: () => new Promise(r => { resolve = r }) })
    await type('Zebra')
    await pick()
    await act(async () => { m.form.reset(); await settle() })
    await act(async () => { resolve({ value: 'z', label: 'Zebra' }); await settle() })
    expect(input().value).toBe('Alpha')
    expect(changed).not.toHaveBeenCalled()
  })
})

describe('Combobox Field composition', () => {
  async function mountField(props: Partial<ComboboxProps> = {}, fieldProps = {}) {
    const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
    const render = async (next: Partial<ComboboxProps> = {}, nextField = {}) => act(async () => {
      root!.render(h(Field, { name: 'company', label: 'Company', ...fieldProps, ...nextField,
        children: h(Combobox, { items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }], ...props, ...next }) }))
      await settle()
    })
    await render()
    return { form, render }
  }
  it('inherits the canonical name and label without submitting search text', async () => {
    const m = await mountField({ defaultValue: 'a' })
    expect(document.querySelector('label')!.htmlFor).toBe(input().id)
    expect(new FormData(m.form).getAll('company')).toEqual(['a'])
    await type('Br')
    expect(new FormData(m.form).getAll('company')).toEqual(['a'])
    await pick()
    expect(new FormData(m.form).getAll('company')).toEqual(['b'])
  })
  it('required means selected, not a nonempty query', async () => {
    const m = await mountField({}, { required: true, error: 'Choose a company' })
    await type('Al')
    expect(input().required).toBe(false)
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(false)
    await pick()
    await act(async () => { await settle() })
    expect(m.form.checkValidity()).toBe(true)
    expect(document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(true)
  })
  it('multiple required selection submits repeated values once and becomes invalid after clear', async () => {
    const m = await mountField({ multiple: true, defaultValue: ['a', 'b'] }, { required: true })
    expect(new FormData(m.form).getAll('company')).toEqual(['a', 'b'])
    expect(m.form.checkValidity()).toBe(true)
    await act(async () => { document.querySelector<HTMLButtonElement>('[data-part="clear"]')!.click(); await settle() })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(new FormData(m.form).getAll('company')).toEqual([])
  })
  it('inherits disabled Field and Fieldset and excludes submission', async () => {
    const m = await mountField({ defaultValue: 'a' }, { disabled: true })
    expect(input().disabled).toBe(true)
    expect(new FormData(m.form).has('company')).toBe(false)
    await act(async () => root!.render(h(Fieldset, { disabled: true, children: h(Combobox, { name: 'company', defaultValue: 'a' }) })))
    expect(input().disabled).toBe(true)
    expect(new FormData(m.form).has('company')).toBe(false)
  })
  it('read-only blocks selection, clear, chip removal and Backspace while allowing browsing', async () => {
    const changed = vi.fn()
    const m = await mountField({ multiple: true, defaultValue: ['a'], onValueChange: changed }, { readOnly: true })
    expect(input().readOnly).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('[data-part="chip-remove"]')!.disabled).toBe(true)
    await act(async () => { document.querySelector<HTMLButtonElement>('[data-part="trigger"]')!.click(); await settle() })
    expect(options()).toHaveLength(2)
    await pick(1)
    await act(async () => { document.querySelector<HTMLButtonElement>('[data-part="clear"]')?.click(); input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true })); await settle() })
    expect(new FormData(m.form).getAll('company')).toEqual(['a'])
    expect(changed).not.toHaveBeenCalled()
  })
  it('explicit child state cannot be erased by an enabled editable Field', async () => {
    const m = await mountField({ defaultValue: 'a', readOnly: true })
    expect(input().readOnly).toBe(true)
    await m.render({ disabled: true })
    expect(input().disabled).toBe(true)
    expect(new FormData(m.form).has('company')).toBe(false)
  })
  it('changing to read-only cancels a pending creation before its late result', async () => {
    let resolve!: (item: { value: string; label: string }) => void
    const changed = vi.fn()
    const m = await mountField({ defaultValue: 'a', onValueChange: changed, onCreate: () => new Promise(r => { resolve = r }) })
    await type('Zebra'); await pick()
    await m.render({}, { readOnly: true })
    await act(async () => { resolve({ value: 'z', label: 'Zebra' }); await settle() })
    expect(new FormData(m.form).getAll('company')).toEqual(['a'])
    expect(changed).not.toHaveBeenCalled()
  })
  it.each([false, true])('Field owns server errors and only accepted selections clear them (refusal: %s)', async refused => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    await act(async () => root!.render(h(Form, { onSubmit: () => ({ errors: { company: 'Unavailable company' } }),
      children: [h(FormSummary, { key: 'summary' }), h(Field, { key: 'field', name: 'company', label: 'Company',
        children: h(Combobox, { items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }], ...(refused ? { value: 'a' } : { defaultValue: 'a' }) }) })] })))
    const form = host.querySelector('form')!
    await act(async () => { form.requestSubmit(); await settle() })
    await act(async () => { await settle() })
    expect(host.querySelectorAll('a')).toHaveLength(1)
    await type('Br'); await pick()
    await act(async () => { await settle() })
    expect(new FormData(form).getAll('company')).toEqual([refused ? 'a' : 'b'])
    expect(host.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(!refused)
    expect(host.querySelectorAll('a')).toHaveLength(refused ? 1 : 0)
  })
})

describe('Combobox required summary', () => {
  it.each([false, true])('maps an empty multiple constraint input to its named visible control (Field: %s)', async wrapped => {
    const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    const child = h(Combobox, { multiple: true, ...(wrapped ? {} : { name: 'reviewers', label: 'Reviewers', required: true }), items: [{ value: 'a', label: 'Alex' }] })
    await act(async () => root!.render(h(Form, { onSubmit: vi.fn(), children: [h(FormSummary, { key: 'summary' }),
      wrapped ? h(Field, { key: 'field', name: 'reviewers', label: 'Reviewers', required: true, error: 'Choose a reviewer', children: child }) : child] })))
    await act(async () => { host.querySelector('form')!.requestSubmit(); await settle() })
    await act(async () => { await settle() })
    const links = host.querySelectorAll<HTMLAnchorElement>('a')
    expect(links).toHaveLength(1)
    expect(links[0].textContent).toContain('Reviewers:')
    if (wrapped) expect(links[0].textContent).toContain('Choose a reviewer')
    expect(links[0].hash).toBe(`#${input().id}`)
    await act(async () => links[0].click())
    expect(document.activeElement).toBe(input())
  })
})
