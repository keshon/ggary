import { act, createElement as h, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { CheckboxGroup, Field, FieldControl, Fieldset, Form, FormSummary, NumberField, RadioGroup, Slider, RangeSlider } from '../packages/react/src/index'
import { typeInto } from './conformance/harness'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const items = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]
const delay = () => new Promise(resolve => setTimeout(resolve, 20))
async function fixture(children: ReactNode) {
  const host = document.createElement('div'); document.body.append(host)
  const root = createRoot(host)
  await act(async () => root.render(children))
  const settle = async () => { await act(delay); await act(delay) }
  return { host, root, settle, dispose: async () => { await act(async () => root.unmount()); host.remove() } }
}
const button = h('button', { key: 'submit', type: 'submit' }, 'Save')

describe('GGary Form and Base UI composition', () => {
  it('a read-only Field slider ignores keyboard changes while retaining its submitted value', async () => {
    const changed = vi.fn()
    const f = await fixture(h('form', {}, h(Field, { name: 'level', label: 'Level', readOnly: true, children: h(Slider, { defaultValue: 30, onValueChange: changed }) })))
    try {
      const input = f.host.querySelector<HTMLInputElement>('input[type="range"]')!
      await act(async () => { input.focus(); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })) }); await f.settle()
      expect(new FormData(f.host.querySelector('form')!).get('level')).toBe('30')
      expect(changed).not.toHaveBeenCalled()
    } finally { await f.dispose() }
  })
  it('disabled Fieldset disables all numeric editors and slider thumbs', async () => {
    const changed = vi.fn()
    const f = await fixture(h(Fieldset, { disabled: true, children: [
      h(NumberField, { key: 'number', name: 'quantity', defaultValue: 3, onValueChange: changed }),
      h(Slider, { key: 'slider', name: 'level', defaultValue: 30, onValueChange: changed }),
      h(RangeSlider, { key: 'range', label: 'Limits', name: 'limits', defaultValue: [20, 80], valueDisplay: 'inputs', onValueChange: changed }),
    ] }))
    try {
      const inputs = Array.from(f.host.querySelectorAll<HTMLInputElement>('input'))
      expect(inputs.length).toBeGreaterThanOrEqual(6)
      expect(inputs.every(input => input.disabled)).toBe(true)
      const number = f.host.querySelector<HTMLInputElement>('[data-scope="number-field"][data-part="input"]')!
      await act(async () => number.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })))
      expect(number.value).toBe('3')
      expect(changed).not.toHaveBeenCalled()
    } finally { await f.dispose() }
  })
  it('registers a custom native control, reveals constraints, focuses through the summary, submits and resets', async () => {
    let native: HTMLElement | null = null
    const onSubmit = vi.fn()
    const validate = vi.fn((data: FormData) => ({ code: data.get('code') ? null : 'Enter a code' }))
    const onBlur = vi.fn()
    const f = await fixture(h(Form, { onSubmit, validate, children: [h(FormSummary, { key: 'summary' }),
      h(Field, { key: 'field', name: 'code', label: 'Code', required: true, hint: 'Three letters', error: 'Enter a code', children:
        h(FieldControl, { ref: element => { native = element }, onBlur, pattern: '[A-Z]{3}', render: h('input', { 'data-scope': 'input', 'data-part': 'root' }) }) }), button] }))
    try {
      const input = native as unknown as HTMLInputElement
      expect(input.name).toBe('code'); expect(input.required).toBe(true)
      expect(f.host.querySelector('label')!.htmlFor).toBe(input.id)
      await act(async () => f.host.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      const summary = f.host.querySelector<HTMLElement>('[data-scope="form-summary"][data-part="root"]')!
      expect(document.activeElement).toBe(summary)
      expect(summary.textContent).toContain('Code: Enter a code')
      await act(async () => summary.querySelector<HTMLAnchorElement>('a')!.click())
      expect(document.activeElement).toBe(input)
      validate.mockClear()
      await act(async () => typeInto(input, 'ABC')); await f.settle()
      expect(validate).toHaveBeenCalledTimes(1)
      expect(input.hasAttribute('aria-invalid')).toBe(false)
      await act(async () => f.host.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      expect(onSubmit).toHaveBeenCalledOnce()
      expect((onSubmit.mock.calls[0][0] as FormData).get('code')).toBe('ABC')
      await act(async () => { input.blur() }); expect(onBlur).toHaveBeenCalled()
      await act(async () => f.host.querySelector<HTMLFormElement>('form')!.reset()); await f.settle()
      expect(native).toBe(input); expect(input.value).toBe(''); expect(input.hasAttribute('aria-invalid')).toBe(false)
    } finally { await f.dispose() }
  })

  for (const tag of ['select', 'textarea'] as const) {
    it(`renders and registers a native ${tag} without losing its ref or handlers`, async () => {
      let native: HTMLElement | null = null
      const onValueChange = vi.fn()
      const rendered = tag === 'select' ? h('select', null, h('option', { value: '' }, 'Pick one'), h('option', { value: 'chosen' }, 'Chosen')) : h('textarea')
      const f = await fixture(h(Field, { name: 'custom', label: 'Custom', required: true, children: h(FieldControl, { ref: element => { native = element }, onValueChange, render: rendered }) }))
      try {
        const control = native as unknown as HTMLInputElement
        expect(control.tagName).toBe(tag.toUpperCase()); expect(control.name).toBe('custom')
        await act(async () => { control.focus(); control.blur() }); await f.settle()
        expect(control.getAttribute('aria-invalid')).toBe('true')
        await act(async () => {
          if (tag === 'select') { control.value = 'chosen'; control.dispatchEvent(new Event('change', { bubbles: true })) }
          else typeInto(control, 'chosen')
        }); await f.settle()
        expect(onValueChange).toHaveBeenLastCalledWith('chosen')
        expect(control.hasAttribute('aria-invalid')).toBe(false)
      } finally { await f.dispose() }
    })
  }

  it('names a required Fieldset once in the summary and routes server errors to the group', async () => {
    const onSubmit = vi.fn(() => ({ errors: { choices: 'Server rejected this selection' } }))
    const f = await fixture(h(Form, { onSubmit, children: [h(FormSummary, { key: 'summary' }),
      h(Fieldset, { key: 'group', name: 'choices', legend: 'Choices', required: true, error: 'Pick a choice', children: h(CheckboxGroup, { items }) }), button] }))
    try {
      const form = f.host.querySelector<HTMLFormElement>('form')!
      const fieldset = f.host.querySelector<HTMLFieldSetElement>('fieldset')!
      const error = fieldset.querySelector<HTMLElement>('[data-part="error"]')!
      await act(async () => form.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      const links = () => [...form.querySelectorAll<HTMLAnchorElement>('[data-scope="form-summary"] a')]
      expect(links()).toHaveLength(1); expect(links()[0].textContent).toBe('Choices: Pick a choice')
      await act(async () => links()[0].click()); expect(document.activeElement).toBe(fieldset)
      await act(async () => fieldset.querySelector<HTMLElement>('[data-part="toggle"]')!.click()); await f.settle()
      expect(error.hidden).toBe(true); expect(new FormData(form).getAll('choices')).toEqual(['a'])
      await act(async () => form.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      expect(error.textContent).toBe('Server rejected this selection'); expect(error.hidden).toBe(false)
      expect(links()).toHaveLength(1); expect(links()[0].getAttribute('href')).toBe(`#${fieldset.id}`)
      await act(async () => form.reset()); await f.settle()
      expect(error.hidden).toBe(true); expect(links()).toHaveLength(0)
    } finally { await f.dispose() }
  })

  it('deduplicates native radio errors and rechecks accepted values after controlled refusal', async () => {
    const validate = vi.fn((data: FormData) => ({ plan: data.get('plan') ? null : 'Pick a plan' }))
    const onValueChange = vi.fn()
    const f = await fixture(h(Form, { validate, onSubmit: vi.fn(), children: [h(FormSummary, { key: 'summary' }),
      h(RadioGroup, { key: 'group', name: 'plan', label: 'Plan', required: true, items, value: null, onValueChange }), button] }))
    try {
      const form = f.host.querySelector<HTMLFormElement>('form')!
      await act(async () => form.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      expect(form.querySelectorAll('[data-scope="form-summary"] a')).toHaveLength(1)
      validate.mockClear()
      await act(async () => form.querySelector<HTMLElement>('[data-part="toggle"]')!.click()); await f.settle()
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('a')
      expect(new FormData(form).get('plan')).toBeNull()
      expect(validate).not.toHaveBeenCalled()
      expect(form.querySelector('[data-scope="form-summary"]')!.textContent).toContain('Plan: Pick a plan')
    } finally { await f.dispose() }
  })
  it('lists required radios once even without custom rules', async () => {
    const f = await fixture(h(Form, { onSubmit: vi.fn(), children: [h(FormSummary, { key: 'summary' }),
      h(RadioGroup, { key: 'group', name: 'plan', label: 'Plan', required: true, items }), button] }))
    try {
      await act(async () => f.host.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      const links = f.host.querySelectorAll<HTMLAnchorElement>('[data-scope="form-summary"] a')
      expect(links).toHaveLength(1); expect(links[0].textContent).toMatch(/^Plan:/)
    } finally { await f.dispose() }
  })

  it('preserves a server error when the controlled group refuses the requested change', async () => {
    const f = await fixture(h(Form, { onSubmit: () => ({ errors: { plan: 'Locked plan' } }), children: [h(FormSummary, { key: 'summary' }),
      h(RadioGroup, { key: 'group', name: 'plan', label: 'Plan', items, value: 'a', onValueChange: vi.fn() }), button] }))
    try {
      await act(async () => f.host.querySelector<HTMLButtonElement>('button')!.click()); await f.settle()
      await act(async () => f.host.querySelectorAll<HTMLElement>('[data-part="toggle"]')[1].click()); await f.settle()
      expect(f.host.querySelector('[data-scope="form-summary"]')!.textContent).toContain('Plan: Locked plan')
      expect(new FormData(f.host.querySelector('form')!).get('plan')).toBe('a')
    } finally { await f.dispose() }
  })

  it('a named numeric Field submits exactly one numeric value', async () => {
    const f = await fixture(h(Form, { onSubmit: vi.fn(), children:
      h(Field, { name: 'quantity', label: 'Quantity', children: h(NumberField, { defaultValue: 3 }) }) }))
    try {
      expect(new FormData(f.host.querySelector('form')!).getAll('quantity')).toEqual(['3'])
    } finally { await f.dispose() }
  })

})
