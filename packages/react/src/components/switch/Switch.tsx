import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { connect, type SwitchProps as CoreSwitchProps } from '@ggary/core/switch'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'

export interface SwitchProps
  extends CoreSwitchProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreSwitchProps | 'type' | 'role' | 'defaultChecked' | 'onChange' | 'children'> {
  /** Controlled. Omit and use `defaultChecked` for uncontrolled. */
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  children?: ReactNode
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, ref) {
  const {
    checked, defaultChecked = false, onCheckedChange, name, value, disabled, readOnly, required, invalid, children, ...rest
  } = props

  const [uncontrolled, setUncontrolled] = useState(defaultChecked)
  const controlled = checked !== undefined

  const api = connect(
    { checked: controlled ? checked : uncontrolled, name, value, disabled, readOnly, required, invalid },
    reactNormalizer,
    {
      onCheckedChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onCheckedChange?.(next)
      },
      field: useFieldControl() ?? undefined,
      // React puts a controlled input back after every event; see utils/choice.
      restoresChecked: true,
    }
  )

  return (
    <label {...api.rootProps}>
      <span {...api.controlProps}>
        <input ref={ref} {...mergeProps(rest, api.inputProps)} />
        <span {...api.thumbProps} />
      </span>
      {children != null && <span {...api.labelProps}>{children}</span>}
    </label>
  )
})
