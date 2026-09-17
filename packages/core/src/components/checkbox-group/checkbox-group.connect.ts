import type { Dict, Normalizer } from '../../types'
import { choice } from '../../utils/choice'
import { choiceGroupFrame } from '../../utils/choice-group'
import type { GroupContext } from '../../utils/group'
import { checkboxAnatomy } from '../checkbox/checkbox.anatomy'
import { checkboxGroupAnatomy } from './checkbox-group.anatomy'
import type { CheckboxGroupProps, CheckboxItem } from './checkbox-group.types'

export interface CheckboxGroupConnectOptions {
  /** The checked values after a toggle, in item order. */
  onValueChange?: (value: string[]) => void
  nativeChecked?: boolean
  /** React restores a controlled checkbox itself; see utils/choice. */
  restoresChecked?: boolean
  group?: GroupContext
}

/**
 * RadioGroup's shape with a value array. Each option is a `checkbox` part, so
 * the theme's checkbox styles it; the frame and list are shared with RadioGroup
 * (utils/choice-group), so the two lists have one rhythm.
 *
 * Native checkboxes have no "at least one" — `required` on each would demand
 * every one. So `required` is a custom validity on the first checkbox:
 * `validationMessage` below, which the adapter applies with setCustomValidity.
 * The browser then blocks the submit, fires `invalid`, and a Fieldset around
 * the group shows its error, exactly as for any other control.
 */
export function connect<T = Dict>(props: CheckboxGroupProps, normalize: Normalizer<T>, options: CheckboxGroupConnectOptions = {}) {
  const { id, items, value = [], label, orientation, disabled, required, invalid } = props
  const name = props.name || id
  const frame = choiceGroupFrame(checkboxGroupAnatomy, {
    id, role: 'group', label, orientation, disabled, required, invalid, group: options.group,
  })

  const toggle = (item: CheckboxItem, checked: boolean) =>
    items.filter((each) => (each.value === item.value ? checked : value.includes(each.value))).map((each) => each.value)

  const messageFor = (checked: string[]) =>
    frame.required && checked.length === 0 ? (props.requiredMessage ?? 'Select at least one option.') : ''

  /**
   * Update "at least one" while the input event is still on the checkbox, before
   * it bubbles: a Fieldset listening above reads the group's validity from that
   * same event, and an adapter's effect would only run after it had.
   */
  const syncValidity = (event: Event, checked: string[]) => {
    const input = event.currentTarget as HTMLInputElement
    const first = input.closest?.('[data-part="list"]')?.querySelector('input')
    first?.setCustomValidity(messageFor(checked))
  }

  const getItemProps = (item: CheckboxItem, index: number) => {
    const parts = choice(checkboxAnatomy, {
      type: 'checkbox',
      id: frame.ids.item(index),
      name,
      value: item.value,
      checked: value.includes(item.value),
      disabled: frame.disabled || item.disabled,
      invalid: frame.invalid,
      nativeChecked: options.nativeChecked,
      restoresChecked: options.restoresChecked,
      onCheckedChange: options.onValueChange ? (checked) => options.onValueChange!(toggle(item, checked)) : undefined,
    })
    const report = parts.inputProps.onInput as ((event: Event) => void) | undefined
    parts.inputProps.onInput = (event: Event) => {
      syncValidity(event, toggle(item, (event.currentTarget as HTMLInputElement).checked))
      report?.(event)
    }
    return {
      rootProps: normalize(parts.rootProps),
      controlProps: normalize(parts.controlProps),
      inputProps: normalize(parts.inputProps),
      indicatorProps: normalize({ ...checkboxAnatomy.attrs('indicator'), ...parts.stateAttrs, 'aria-hidden': 'true', 'data-icon': 'check' }),
      labelProps: normalize(parts.labelProps),
    }
  }

  return {
    ids: frame.ids,
    name,
    value,
    items,
    getItemProps,
    /** For setCustomValidity on the first checkbox: '' when the group is valid. */
    validationMessage: messageFor(value),
    rootProps: normalize(frame.rootProps),
    labelProps: normalize(frame.labelProps),
    listProps: normalize(frame.listProps),
  }
}
