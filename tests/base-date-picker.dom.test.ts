import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DatePicker, type DatePickerProps } from '../packages/react/src/components/date-picker/DatePicker'
import { Field } from '../packages/react/src/components/field/Field'
import { Fieldset } from '../packages/react/src/components/fieldset/Fieldset'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function mount(props: DatePickerProps = {}, field = {}, group = {}) {
  const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
  await act(async () => { root!.render(h(Fieldset, { ...group, children: h(Field, { name: 'date', label: 'Due date', ...field, children: h(DatePicker, { locale: 'en-GB', ...props }) }) })); await settle() })
  return { form, editor: form.querySelector<HTMLInputElement>('[data-scope="date-picker"][data-part="input"]')!, constraint: form.querySelector<HTMLInputElement>('input[name="date"]')! }
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); await settle() })
}
describe('DatePicker Field constraints', () => {
  it('owns one canonical submission and the Field label focuses the editor', async () => {
    const m = await mount({ defaultValue: '2026-10-14' })
    expect(new FormData(m.form).getAll('date')).toEqual(['2026-10-14'])
    expect(document.querySelector('label')!.htmlFor).toBe(m.editor.id)
    await act(async () => m.constraint.focus())
    expect(document.activeElement).toBe(m.editor)
  })
  it('required is enforced on the selection, with deferred Field errors', async () => {
    const m = await mount({}, { required: true, error: 'Choose a date' })
    const error = document.querySelector<HTMLElement>('[data-scope="field"][data-part="error"]')!
    expect(error.hidden).toBe(true)
    await act(async () => { expect(m.form.checkValidity()).toBe(false); await settle() })
    expect(error.hidden).toBe(false)
  })
  it('invalid typed drafts cannot submit the previously accepted value', async () => {
    const m = await mount({ defaultValue: '2026-10-14' })
    await type(m.editor, 'garbage')
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    expect(new FormData(m.form).get('date')).toBe('2026-10-14')
    await act(async () => { m.form.reset(); await settle() })
    expect(m.form.checkValidity()).toBe(true)
  })
  it('typed dates commit on Enter and submit their canonical value', async () => {
    const m = await mount()
    await type(m.editor, '2026-10-20')
    await act(async () => { m.editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
    expect(m.form.checkValidity()).toBe(true)
    expect(new FormData(m.form).get('date')).toBe('2026-10-20')
  })
  it.each([
    { value: '2026-10-14', min: '2026-10-15' },
    { value: '2026-10-14', isDateDisabled: () => true },
    { mode: 'range', value: { start: '2026-10-14', end: null } },
  ] as DatePickerProps[])('rejects unavailable or incomplete values (%j)', async props => {
    const m = await mount(props)
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
  })
  it('keeps the accepted date when its controlled owner refuses a typed request', async () => {
    const changed = vi.fn()
    const m = await mount({ value: '2026-10-14', onValueChange: changed })
    await type(m.editor, '2026-10-20')
    await act(async () => { m.editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
    expect(changed).toHaveBeenCalledWith({ start: '2026-10-20', end: null })
    expect(new FormData(m.form).getAll('date')).toEqual(['2026-10-14'])
  })
  it('disabled Fieldset excludes submission and disables the editor', async () => {
    const m = await mount({ defaultValue: '2026-10-14' }, {}, { disabled: true })
    expect(m.editor.disabled).toBe(true)
    expect(new FormData(m.form).has('date')).toBe(false)
  })
  it('read-only inherits Field state and refuses keyboard edits', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: '2026-10-14', onValueChange: changed }, { readOnly: true, required: true })
    expect(m.editor.readOnly).toBe(true)
    await type(m.editor, '2026-10-20')
    await act(async () => { m.editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
    expect(new FormData(m.form).get('date')).toBe('2026-10-14')
    expect(changed).not.toHaveBeenCalled()
  })
})
