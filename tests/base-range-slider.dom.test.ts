import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { RangeSlider, Field, Fieldset, Form, FormSummary } from '../packages/react/src/index'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function mount(props = {}, field = {}, group = {}) {
 const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
 const render = async (next = {}) => act(async () => { root!.render(h(Fieldset, { ...group, children: h(Field, { name: 'range', label: 'Price range', ...field, children: h(RangeSlider, { defaultValue: [20, 80], valueDisplay: 'inputs', ...props, ...next }) }) })); await settle() })
 await render(); return { form, render, editor: () => form.querySelector<HTMLInputElement>('input[type="number"]')! }
}
async function type(input: HTMLInputElement, value: string) {
 await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); await settle() })
}
describe('RangeSlider compound Field contract', () => {
 it('submits exactly two values, with unique editor and thumb IDs', async () => {
  const m = await mount()
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '80'])
  const ids = Array.from(m.form.querySelectorAll('[id]')).map(element => element.id)
  expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([])
  expect(m.form.querySelector('[data-scope=range-slider][data-part=root]')!.getAttribute('aria-labelledby')).toBe(document.querySelector('label')!.id)
  expect(document.querySelector('label')!.htmlFor).toBe(m.form.querySelector('input[type="range"]')!.id)
 })
 it('preserves explicit separate endpoint names', async () => {
  const m = await mount({ name: ['lower', 'upper'] }, { name: undefined })
  expect(Array.from(new FormData(m.form).entries())).toEqual([['lower', '20'], ['upper', '80']])
 })
 it('blocks uncommitted drafts, commits on Enter, and clears drafts on reset', async () => {
  const m = await mount()
  await type(m.editor(), '35')
  await act(async () => { expect(m.form.checkValidity()).toBe(false) })
  await act(async () => { m.editor().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
  expect(new FormData(m.form).getAll('range')).toEqual(['35', '80'])
  expect(m.form.checkValidity()).toBe(true)
  await type(m.editor(), '42')
  await m.render({ defaultValue: [10, 90] })
  await act(async () => { m.form.reset(); await settle() })
  expect(m.editor().value).toBe('10')
  expect(new FormData(m.form).getAll('range')).toEqual(['10', '90'])
  expect(m.form.checkValidity()).toBe(true)
 })
 it('validates supplied minimum-gap violations instead of submitting them', async () => {
  const m = await mount({ value: [20, 22], minGap: 5 })
  await act(async () => { expect(m.form.checkValidity()).toBe(false) })
 })
 it('inherits read-only across editors and thumbs', async () => {
  const change = vi.fn(); const m = await mount({ onValueChange: change }, { readOnly: true })
  expect(m.editor().readOnly).toBe(true)
  const thumb = m.form.querySelector<HTMLInputElement>('input[type="range"]')!
  await act(async () => { thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await settle() })
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '80'])
  expect(change).not.toHaveBeenCalled()
 })
 it('disabled Fieldset excludes both submitted endpoints', async () => {
  const m = await mount({}, {}, { disabled: true })
  expect(new FormData(m.form).has('range')).toBe(false)
  expect(m.editor().disabled).toBe(true)
 })
 it('upper-end edits clear server errors and summary links target the first thumb', async () => {
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => { root!.render(h(Form, { onSubmit: () => ({ errors: { range: 'Server rejected range' } }), children: [
   h(FormSummary, { key: 'summary' }), h(Field, { key: 'field', name: 'range', label: 'Price range', children: h(RangeSlider, { defaultValue: [20, 80], valueDisplay: 'inputs' }) }), h('button', { key: 'submit', type: 'submit' }, 'Save'),
  ] })); await settle() })
  await act(async () => { host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click(); await settle() })
  const link = host.querySelector<HTMLAnchorElement>('[data-scope="form-summary"] a')!
  expect(link.textContent).toContain('Price range: Server rejected range')
  await act(async () => { link.click(); await settle() })
  expect(document.activeElement).toBe(host.querySelector('input[type="range"]'))
  const upper = host.querySelectorAll<HTMLInputElement>('input[type="number"]')[1]
  await type(upper, '90')
  await act(async () => { upper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
  expect(new FormData(host.querySelector('form')!).getAll('range')).toEqual(['20', '90'])
  expect(host.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!.hidden).toBe(true)
 })
 it('controlled refusal preserves canonical values and reset removes its draft', async () => {
  const changed = vi.fn(); const m = await mount({ value: [20, 80], onValueChange: changed })
  await type(m.editor(), '35')
  await act(async () => { m.editor().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
  expect(changed).toHaveBeenCalledWith([35, 80])
  expect(new FormData(m.form).getAll('range')).toEqual(['20', '80'])
  await type(m.editor(), '42')
  await act(async () => { m.form.reset(); await settle() })
  expect(m.editor().value).toBe('20')
 })
})
