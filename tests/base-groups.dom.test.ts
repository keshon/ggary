import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { CheckboxGroup, RadioGroup, Fieldset } from '../packages/react/src/index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const items = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C', disabled: true }]

async function fixture(children: React.ReactNode) {
  const form = document.createElement('form')
  document.body.append(form)
  const root = createRoot(form)
  await act(async () => root.render(children))
  return { form, root, dispose: async () => { await act(async () => root.unmount()); form.remove() } }
}

describe('Base UI group integration', () => {
  for (const kind of ['checkbox', 'radio'] as const) {
    it(`${kind}: controlled refusal preserves submitted values and reset does not override the owner`, async () => {
      const callback = vi.fn()
      const f = await fixture(kind === 'checkbox'
        ? createElement(CheckboxGroup, { items, name: 'choice', value: ['a'], onValueChange: callback })
        : createElement(RadioGroup, { items, name: 'choice', value: 'a', onValueChange: callback }))
      try {
        const toggles = f.form.querySelectorAll<HTMLElement>('[data-part="toggle"]')
        await act(async () => toggles[1].click())
        expect(callback).toHaveBeenCalledExactlyOnceWith(kind === 'checkbox' ? ['a', 'b'] : 'b')
        expect(new FormData(f.form).getAll('choice')).toEqual(['a'])
        await act(async () => { f.form.reset(); await new Promise(resolve => setTimeout(resolve, 20)) })
        expect(new FormData(f.form).getAll('choice')).toEqual(['a'])
        expect(toggles[2].getAttribute('aria-disabled')).toBe('true')
        expect(toggles[2].tabIndex).toBe(-1)
      } finally { await f.dispose() }
    })

    it(`${kind}: reset restores defaults and clears revealed fieldset errors`, async () => {
      const f = await fixture(createElement(Fieldset, { required: true, error: 'Pick one', children: kind === 'checkbox'
        ? createElement(CheckboxGroup, { items, name: 'choice' })
        : createElement(RadioGroup, { items, name: 'choice' }) }))
      try {
        const error = f.form.querySelector<HTMLElement>('[data-scope="fieldset"][data-part="error"]')!
        const toggle = f.form.querySelector<HTMLElement>('[data-part="toggle"]')!
        await act(async () => { f.form.checkValidity() })
        expect(error.hidden).toBe(false)
        await act(async () => toggle.click())
        expect(error.hidden).toBe(true)
        expect(new FormData(f.form).getAll('choice')).toEqual(['a'])
        await act(async () => { f.form.reset(); await new Promise(resolve => setTimeout(resolve, 20)) })
        expect(new FormData(f.form).getAll('choice')).toEqual([])
        expect(error.hidden).toBe(true)
        expect(f.form.querySelector('[aria-invalid="true"]')).toBeNull()
        expect(f.form.querySelector<HTMLInputElement>('input')!.validity.valid).toBe(false)
      } finally { await f.dispose() }
    })
  }
  it('a selected disabled checkbox cannot satisfy required submission', async () => {
    const f = await fixture(createElement(CheckboxGroup, { items, name: 'choice', required: true, defaultValue: ['c'] }))
    try {
      expect(new FormData(f.form).getAll('choice')).toEqual([])
      expect(f.form.checkValidity()).toBe(false)
      await act(async () => f.form.querySelector<HTMLElement>('[data-part="toggle"]')!.click())
      expect(f.form.checkValidity()).toBe(true)
    } finally { await f.dispose() }
  })
  it('a selected disabled radio cannot satisfy required submission', async () => {
    const f = await fixture(createElement(RadioGroup, { items, name: 'choice', required: true, defaultValue: 'c' }))
    try {
      expect(new FormData(f.form).get('choice')).toBeNull()
      expect(f.form.checkValidity()).toBe(false)
      await act(async () => f.form.querySelector<HTMLElement>('[data-part="toggle"]')!.click())
      expect(f.form.checkValidity()).toBe(true)
    } finally { await f.dispose() }
  })

})
