import { forwardRef, useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { connect, type CheckboxProps as CoreCheckboxProps, type CheckedState } from '@ggary/core/checkbox'
import { mergeProps, reactNormalizer } from '@ggary/core'
import { useFieldControl } from '../field/Field'
import { useMergedRef } from '../../utils/use-merged-ref'
import { useFormReset } from '../../utils/use-form-reset'

export interface CheckboxProps
  extends CoreCheckboxProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, keyof CoreCheckboxProps | 'type' | 'defaultChecked' | 'onChange' | 'children'> {
  /** Controlled. Omit and use `defaultChecked` for uncontrolled. */
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: boolean) => void
  /** The label text. Without it, give the input an `aria-label`. */
  children?: ReactNode
}

/** Other props go to the native input, which is the focusable, labelled control. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, forwardedRef) {
  const {
    checked, defaultChecked = false, onCheckedChange, name, value, disabled, readOnly, required, invalid, children, ...rest
  } = props

  const [uncontrolled, setUncontrolled] = useState<CheckedState>(defaultChecked)
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

  const element = useRef<HTMLInputElement | null>(null)
  const ref = useMergedRef(element, forwardedRef)
  useFormReset(element, () => setUncontrolled(defaultChecked))

  // A property, not an attribute: no prop bag can carry it.
  useLayoutEffect(() => {
    if (element.current) element.current.indeterminate = api.indeterminate
  }, [api.indeterminate])

  return (
    <label {...api.rootProps}>
      <span {...api.controlProps}>
        <input ref={ref} {...mergeProps(rest, api.inputProps)} />
        <span {...api.indicatorProps} />
      </span>
      {children != null && <span {...api.labelProps}>{children}</span>}
    </label>
  )
})
