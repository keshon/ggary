import type { Dict, Normalizer } from '../../types'
import { choice } from '../../utils/choice'
import { checkboxAnatomy } from './checkbox.anatomy'
import type { CheckboxProps } from './checkbox.types'

export interface CheckboxConnectOptions {
  /** The user toggled it. Always a boolean: a user cannot choose "indeterminate". */
  onCheckedChange?: (checked: boolean) => void
  /** The canonical control props of an enclosing Field. */
  field?: Dict
  /** The native input owns its checked state (enhanced server markup). */
  nativeChecked?: boolean
  /** The renderer restores `checked` after every event, as React does. See utils/choice. */
  restoresChecked?: boolean
}

/**
 * No machine: the checked state is the native input's, owned by the adapter
 * the way Input's value is. The adapter passes the resolved `checked`.
 *
 * `indeterminate` is a DOM property with no attribute, so no prop bag can set
 * it: the adapter assigns `api.indeterminate` to the element after rendering.
 */
export function connect<T = Dict>(props: CheckboxProps, normalize: Normalizer<T>, options: CheckboxConnectOptions = {}) {
  const { checked = false, name, value, disabled, readOnly, required, invalid } = props
  const indeterminate = checked === 'indeterminate'

  const parts = choice(checkboxAnatomy, {
    type: 'checkbox',
    name,
    value,
    checked: checked === true,
    indeterminate,
    disabled,
    readOnly,
    required,
    invalid,
    nativeChecked: options.nativeChecked,
    restoresChecked: options.restoresChecked,
    onCheckedChange: options.onCheckedChange,
    field: options.field,
  })

  return {
    checked,
    indeterminate,
    rootProps: normalize(parts.rootProps),
    controlProps: normalize(parts.controlProps),
    inputProps: normalize(parts.inputProps),
    indicatorProps: normalize({
      ...checkboxAnatomy.attrs('indicator'),
      ...parts.stateAttrs,
      'aria-hidden': 'true',
      'data-icon': indeterminate ? 'minus' : 'check',
    }),
    labelProps: normalize(parts.labelProps),
  }
}
