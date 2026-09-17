import type { Dict, Normalizer } from '../../types'
import { choice } from '../../utils/choice'
import { radioAnatomy, radioGroupAnatomy } from './radio-group.anatomy'
import type { RadioGroupProps, RadioItem } from './radio-group.types'

export const radioGroupIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  item: (index: number) => `${id}-item-${index}`,
})

export interface RadioGroupConnectOptions {
  onValueChange?: (value: string) => void
  /** The native inputs own their checked state (enhanced server markup). */
  nativeChecked?: boolean
}

/**
 * No machine, and no keyboard code. Native radios that share a `name` already
 * are one tab stop, move and select with the arrow keys, and submit their
 * value; a roving tabindex rebuilt in JS would be a worse copy. So `name` is
 * never absent: without one the group falls back to its id.
 */
export function connect<T = Dict>(props: RadioGroupProps, normalize: Normalizer<T>, options: RadioGroupConnectOptions = {}) {
  const { id, items, value = null, label, orientation = 'vertical', disabled, required, invalid } = props
  const name = props.name || id
  const ids = radioGroupIds(id)

  const getItemProps = (item: RadioItem, index: number) => {
    const parts = choice(radioAnatomy, {
      type: 'radio',
      id: ids.item(index),
      name,
      value: item.value,
      checked: item.value === value,
      disabled: disabled || item.disabled,
      required,
      nativeChecked: options.nativeChecked,
      // A radio fires `input` only when it BECOMES checked, never when a
      // sibling takes the check away, so every call here is a selection.
      onCheckedChange: options.onValueChange ? () => options.onValueChange!(item.value) : undefined,
    })
    return {
      rootProps: normalize(parts.rootProps),
      controlProps: normalize(parts.controlProps),
      inputProps: normalize(parts.inputProps),
      indicatorProps: normalize({ ...radioAnatomy.attrs('indicator'), ...parts.stateAttrs, 'aria-hidden': 'true' }),
      labelProps: normalize(parts.labelProps),
    }
  }

  return {
    ids,
    name,
    value,
    items,
    getItemProps,
    rootProps: normalize({
      ...radioGroupAnatomy.attrs('root'),
      id: ids.root,
      role: 'radiogroup',
      'aria-labelledby': label ? ids.label : undefined,
      'aria-required': required ? 'true' : undefined,
      'aria-invalid': invalid ? 'true' : undefined,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
      'data-invalid': invalid ? '' : undefined,
    }),
    labelProps: normalize({ ...radioGroupAnatomy.attrs('label'), id: ids.label }),
    listProps: normalize({ ...radioGroupAnatomy.attrs('list'), 'data-orientation': orientation }),
  }
}
