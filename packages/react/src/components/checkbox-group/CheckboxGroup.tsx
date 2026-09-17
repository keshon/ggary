import { useId, useLayoutEffect, useRef, useState } from 'react'
import { connect, type CheckboxGroupOrientation, type CheckboxItem } from '@ggary/core/checkbox-group'
import { reactNormalizer } from '@ggary/core'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormReset } from '../../utils/use-form-reset'

export interface CheckboxGroupProps {
  items: CheckboxItem[]
  name?: string
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  label?: string
  orientation?: CheckboxGroupOrientation
  disabled?: boolean
  /** At least one checked. */
  required?: boolean
  invalid?: boolean
  requiredMessage?: string
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    items, name, value, defaultValue = [], onValueChange, label, orientation, disabled, required, invalid, requiredMessage,
  } = props
  const id = `gg-checkboxes-${useId().replace(/:/g, '')}`

  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const controlled = value !== undefined

  const api = connect(
    { id, items, name, value: controlled ? value : uncontrolled, label, orientation, disabled, required, invalid, requiredMessage },
    reactNormalizer,
    {
      onValueChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onValueChange?.(next)
      },
      restoresChecked: true,
      group: useFieldsetGroup() ?? undefined,
    }
  )

  // "At least one" has no attribute; it is a custom validity on the first box.
  const list = useRef<HTMLDivElement>(null)
  useFormReset(list, () => setUncontrolled(defaultValue))
  useLayoutEffect(() => {
    list.current?.querySelector('input')?.setCustomValidity(api.validationMessage)
  }, [api.validationMessage, items])

  return (
    <div {...api.rootProps}>
      {label && <span {...api.labelProps}>{label}</span>}
      <div ref={list} {...api.listProps}>
        {items.map((item, index) => {
          const parts = api.getItemProps(item, index)
          return (
            <label key={item.value} {...parts.rootProps}>
              <span {...parts.controlProps}>
                <input {...parts.inputProps} />
                <span {...parts.indicatorProps} />
              </span>
              <span {...parts.labelProps}>{item.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
