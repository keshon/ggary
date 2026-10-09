import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { TimePicker, type TimePickerProps } from '../packages/react/src/components/time-picker/TimePicker'
import { DatePicker } from '../packages/react/src/components/date-picker/DatePicker'
import { Field } from '../packages/react/src/components/field/Field'
import { Fieldset } from '../packages/react/src/components/fieldset/Fieldset'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 40))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function mount(props: TimePickerProps = {}, field = {}, group = {}, datetime = false) {
  const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
  await act(async () => {
    const child = datetime ? h(DatePicker, { time: true, defaultValue: '2026-10-14T14:30', locale: 'en-GB' }) : h(TimePicker, { locale: 'en-GB', ...props })
    root!.render(h(Fieldset, { ...group, children: h(Field, { name: 'choice', label: 'Appointment', ...field, children: child }) })); await settle()
  })
  return { form, editor: form.querySelector<HTMLInputElement>('[data-scope="time-picker"][data-part="input"]')! }
}
async function type(input: HTMLInputElement, value: string) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); await settle() })
}
describe('TimePicker and DateTime Field ownership', () => {
  it('submits one canonical time and associates the Field label with its editor', async () => {
    const m = await mount({ defaultValue: '14:30' })
    expect(new FormData(m.form).getAll('choice')).toEqual(['14:30'])
    expect(document.querySelector('label')!.htmlFor).toBe(m.editor.id)
    expect(m.form.checkValidity()).toBe(true)
  })
  it('enforces required and excludes disabled Fieldsets', async () => {
    let m = await mount({}, { required: true })
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    await act(async () => root!.unmount()); document.body.replaceChildren()
    m = await mount({ defaultValue: '14:30' }, { required: true }, { disabled: true })
    expect(m.editor.disabled).toBe(true)
    expect(new FormData(m.form).has('choice')).toBe(false)
    expect(m.form.checkValidity()).toBe(true)
  })
  it.each([{ value: '14:30', min: '15:00' }, { value: '14:30', isTimeDisabled: () => true }])('validates unavailable supplied time %j', async props => {
    const m = await mount(props)
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
  })
  it('blocks drafts and accepts an off-step typed time on Enter', async () => {
    const m = await mount({ defaultValue: '14:30' })
    await type(m.editor, 'invalid')
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    await type(m.editor, '14:37')
    await act(async () => { m.editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
    expect(m.form.checkValidity()).toBe(true)
    expect(new FormData(m.form).getAll('choice')).toEqual(['14:37'])
  })
  it('inherits read-only and refuses change requests', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: '14:30', onValueChange: changed }, { readOnly: true })
    expect(m.editor.readOnly).toBe(true)
    await type(m.editor, '16:00')
    expect(new FormData(m.form).getAll('choice')).toEqual(['14:30'])
    expect(changed).not.toHaveBeenCalled()
  })
  it('a controlled owner can refuse a typed time without changing submission', async () => {
    const changed = vi.fn()
    const m = await mount({ value: '14:30', onValueChange: changed })
    await type(m.editor, '16:45')
    await act(async () => { m.editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await settle() })
    expect(changed).toHaveBeenCalledWith('16:45')
    expect(new FormData(m.form).getAll('choice')).toEqual(['14:30'])
    expect(m.editor.value).toBe('14:30')
  })
  it('DateTime submits one pair and an embedded draft invalidates that pair', async () => {
    const m = await mount({}, { required: true }, {}, true)
    expect(new FormData(m.form).getAll('choice')).toEqual(['2026-10-14T14:30'])
    const date = m.form.querySelector<HTMLInputElement>('[data-scope="date-picker"][data-part="input"]')!
    expect(document.querySelector('label')!.htmlFor).toBe(date.id)
    expect(date.id).not.toBe(m.editor.id)
    expect(m.form.checkValidity()).toBe(true)
    await type(m.editor, 'invalid')
    await act(async () => { expect(m.form.checkValidity()).toBe(false) })
    await act(async () => { m.form.reset(); await settle() })
    expect(m.form.checkValidity()).toBe(true)
    expect(new FormData(m.form).getAll('choice')).toEqual(['2026-10-14T14:30'])
  })
  it('a partially completed DateTime is invalid even when optional', async () => {
    const form = document.createElement('form'); document.body.append(form); root = createRoot(form)
    await act(async () => { root!.render(h(Field, { name: 'choice', label: 'Appointment', children: h(DatePicker, { time: true, defaultValue: '2026-10-14', locale: 'en-GB' }) })); await settle() })
    await act(async () => { expect(form.checkValidity()).toBe(false) })
    expect(new FormData(form).getAll('choice')).toEqual([''])
  })
  it('DateTime read-only and disabled apply to both editors', async () => {
    const m = await mount({}, { readOnly: true }, { disabled: true }, true)
    expect(m.editor.readOnly).toBe(true)
    expect(m.editor.disabled).toBe(true)
    expect(new FormData(m.form).has('choice')).toBe(false)
  })
})
