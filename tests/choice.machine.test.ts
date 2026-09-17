import { describe, expect, it, vi } from 'vitest'
import { connect as checkbox } from '../packages/core/src/components/checkbox/checkbox.connect'
import { connect as checkboxGroup } from '../packages/core/src/components/checkbox-group/checkbox-group.connect'
import { connect as radioGroup } from '../packages/core/src/components/radio-group/radio-group.connect'
import { connect as switchControl } from '../packages/core/src/components/switch/switch.connect'
import { domNormalizer, reactNormalizer, svelteNormalizer } from '../packages/core/src/normalize-props'

/**
 * The choice controls have no machines — the checked state is the native
 * input's — so what is tested here is connect(): states, the Field merge, the
 * readonly substitute, and the naming rules. Behaviour in a DOM is conformance.
 */
const identity = <T,>(props: T) => props
const inputEvent = (checked: boolean) => ({ currentTarget: { checked } }) as unknown as Event

describe('checkbox connect', () => {
  it('names three states on every part, and the glyph for each', () => {
    for (const [checked, state, icon] of [
      [false, 'unchecked', 'check'],
      [true, 'checked', 'check'],
      ['indeterminate', 'indeterminate', 'minus'],
    ] as const) {
      const api = checkbox({ checked }, identity)
      for (const part of [api.rootProps, api.controlProps, api.inputProps, api.indicatorProps, api.labelProps]) {
        expect(part['data-state']).toBe(state)
      }
      expect(api.indicatorProps['data-icon']).toBe(icon)
    }
  })

  it('indeterminate is not checked: the property is the adapter’s to set', () => {
    const api = checkbox({ checked: 'indeterminate' }, identity)
    expect(api.inputProps.checked).toBe(false)
    expect(api.indeterminate).toBe(true)
  })

  it('reports a toggle as a boolean', () => {
    const onCheckedChange = vi.fn()
    checkbox({ checked: 'indeterminate' }, identity, { onCheckedChange }).inputProps.onInput(inputEvent(true))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('readonly is aria-readonly and a blocked click, and never a readonly attribute', () => {
    const api = checkbox({ readOnly: true }, identity, { field: { readOnly: true, id: 'f-control' } })
    expect(api.inputProps['aria-readonly']).toBe('true')
    expect(api.inputProps.readOnly).toBeUndefined()
    const event = { preventDefault: vi.fn() }
    api.inputProps.onClick(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('takes a Field’s id, description, flags and handlers, merged with its own', () => {
    const fieldBlur = vi.fn()
    const own = vi.fn()
    const api = checkbox({}, identity, {
      onCheckedChange: own,
      field: { id: 'f-control', 'aria-describedby': 'f-hint', 'aria-invalid': 'true', disabled: true, onBlur: fieldBlur, onInput: vi.fn() },
    })
    expect(api.inputProps).toMatchObject({ id: 'f-control', 'aria-describedby': 'f-hint', disabled: true })
    expect(api.rootProps['data-invalid']).toBe('')
    expect(api.rootProps['data-disabled']).toBe('')
    api.inputProps.onInput(inputEvent(true))
    expect(own).toHaveBeenCalledWith(true)
  })

  it('leaves the checked state alone when the native input owns it', () => {
    const api = checkbox({ checked: true }, identity, { nativeChecked: true })
    expect(api.inputProps.checked).toBeUndefined()
    expect(api.rootProps['data-state']).toBe('checked')
  })

  it('keeps checked={false} for React and Svelte, and drops the attribute for the DOM', () => {
    expect(checkbox({ checked: false }, reactNormalizer).inputProps).toHaveProperty('checked', false)
    expect(checkbox({ checked: false }, svelteNormalizer).inputProps).toHaveProperty('checked', false)
    expect(checkbox({ checked: false }, domNormalizer).inputProps.attrs).not.toHaveProperty('checked')
  })
})

describe('switch connect', () => {
  it('is a checkbox input with the switch role and a thumb', () => {
    const api = switchControl({ checked: true }, identity)
    expect(api.inputProps).toMatchObject({ type: 'checkbox', role: 'switch', checked: true })
    expect(api.thumbProps).toMatchObject({ 'data-scope': 'switch', 'data-part': 'thumb', 'data-state': 'checked', 'aria-hidden': 'true' })
  })
})

describe('radio group connect', () => {
  const items = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro', disabled: true },
  ]

  it('is a labelled radiogroup whose options share one name, the id when none is given', () => {
    const api = radioGroup({ id: 'plan', items, label: 'Plan' }, identity)
    expect(api.rootProps).toMatchObject({ role: 'radiogroup', 'aria-labelledby': 'plan-label', 'data-orientation': 'vertical' })
    expect(api.getItemProps(items[0], 0).inputProps).toMatchObject({ type: 'radio', name: 'plan', value: 'free', id: 'plan-item-0' })
    expect(radioGroup({ id: 'plan', name: 'tier', items }, identity).name).toBe('tier')
  })

  it('checks the option matching the value, and disables per option or as a group', () => {
    const api = radioGroup({ id: 'plan', items, value: 'free' }, identity)
    expect(api.getItemProps(items[0], 0).inputProps.checked).toBe(true)
    expect(api.getItemProps(items[1], 1).inputProps).toMatchObject({ checked: false, disabled: true })
    const off = radioGroup({ id: 'plan', items, disabled: true }, identity)
    expect(off.getItemProps(items[0], 0).inputProps.disabled).toBe(true)
    expect(off.rootProps['aria-disabled']).toBe('true')
  })

  it('reports the value of the option that became checked', () => {
    const onValueChange = vi.fn()
    radioGroup({ id: 'plan', items }, identity, { onValueChange }).getItemProps(items[0], 0).inputProps.onInput(inputEvent(true))
    expect(onValueChange).toHaveBeenCalledWith('free')
  })
})

describe('checkbox group connect', () => {
  const items = [
    { value: 'open', label: 'Open' },
    { value: 'mine', label: 'Mine' },
    { value: 'starred', label: 'Starred', disabled: true },
  ]
  const onValueChange = vi.fn()
  const group = (props: Partial<Parameters<typeof checkboxGroup>[0]> = {}, options = {}) =>
    checkboxGroup({ id: 'g', items, ...props }, identity, { onValueChange, ...options })

  it('is a named group of checkboxes sharing one name', () => {
    const api = group({ label: 'Show' })
    expect(api.rootProps).toMatchObject({ role: 'group', 'aria-labelledby': 'g-label' })
    expect(api.getItemProps(items[1], 1).inputProps).toMatchObject({ type: 'checkbox', name: 'g', value: 'mine', id: 'g-item-1' })
  })

  it('reports the checked values in item order, whichever was toggled last', () => {
    const api = group({ value: ['mine'] })
    api.getItemProps(items[0], 0).inputProps.onInput({ currentTarget: { checked: true } })
    expect(onValueChange).toHaveBeenLastCalledWith(['open', 'mine'])
    api.getItemProps(items[1], 1).inputProps.onInput({ currentTarget: { checked: false } })
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  it('required means at least one, as a custom validity, not `required` on each box', () => {
    expect(group({ required: true }).validationMessage).toBe('Select at least one option.')
    expect(group({ required: true, value: ['open'] }).validationMessage).toBe('')
    expect(group({ required: true, requiredMessage: 'Pick one' }).validationMessage).toBe('Pick one')
    expect(group({ required: true }).getItemProps(items[0], 0).inputProps.required).toBeUndefined()
  })
})

describe('an option group inside a fieldset', () => {
  const items = [{ value: 'a', label: 'A' }]
  const context = { invalid: true, required: true, disabled: false }

  it('without a label of its own, leaves naming to the fieldset and takes its state', () => {
    const api = radioGroup({ id: 'r', items }, identity, { group: context })
    expect(api.rootProps.role).toBeUndefined()
    expect(api.rootProps['aria-invalid']).toBeUndefined()
    expect(api.getItemProps(items[0], 0).inputProps).toMatchObject({ required: true, 'aria-invalid': 'true' })
  })

  it('with a label of its own, stays a named group', () => {
    const api = checkboxGroup({ id: 'c', items, label: 'More' }, identity, { group: context })
    expect(api.rootProps).toMatchObject({ role: 'group', 'aria-labelledby': 'c-label', 'aria-invalid': 'true' })
    expect(api.validationMessage).not.toBe('')
  })
})
