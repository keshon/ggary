import type { Dict, Normalizer } from '../../types'
import { choice } from '../../utils/choice'
import { switchAnatomy } from './switch.anatomy'
import type { SwitchProps } from './switch.types'

export interface SwitchConnectOptions {
  onCheckedChange?: (checked: boolean) => void
  field?: Dict
  nativeChecked?: boolean
  /** The renderer restores `checked` after every event, as React does. See utils/choice. */
  restoresChecked?: boolean
}

/**
 * A checkbox with `role="switch"`: the native input keeps keyboard, form and
 * label behaviour, and assistive tech announces "on/off" instead of
 * "checked/not checked". Use it for a setting that takes effect at once; a
 * checkbox is for a choice submitted with a form.
 */
export function connect<T = Dict>(props: SwitchProps, normalize: Normalizer<T>, options: SwitchConnectOptions = {}) {
  const { checked = false, name, value, disabled, readOnly, required, invalid } = props

  const parts = choice(switchAnatomy, {
    type: 'checkbox',
    role: 'switch',
    name,
    value,
    checked,
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
    rootProps: normalize(parts.rootProps),
    controlProps: normalize(parts.controlProps),
    inputProps: normalize(parts.inputProps),
    thumbProps: normalize({ ...switchAnatomy.attrs('thumb'), ...parts.stateAttrs, 'aria-hidden': 'true' }),
    labelProps: normalize(parts.labelProps),
  }
}
