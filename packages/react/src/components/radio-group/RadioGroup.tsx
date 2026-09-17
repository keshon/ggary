import { useId, useState } from 'react'
import { connect, type RadioGroupOrientation, type RadioItem } from '@ggary/core/radio-group'
import { reactNormalizer } from '@ggary/core'
import { useFieldsetGroup } from '../fieldset/Fieldset'

export interface RadioGroupProps {
  items: RadioItem[]
  name?: string
  /** Controlled; `null` is controlled with nothing chosen. Omit for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  label?: string
  orientation?: RadioGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export function RadioGroup(props: RadioGroupProps) {
  const { items, name, value, defaultValue = null, onValueChange, label, orientation, disabled, required, invalid } = props
  const id = `gg-radio-${useId().replace(/:/g, '')}`

  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const controlled = value !== undefined

  const api = connect(
    { id, items, name, value: controlled ? value : uncontrolled, label, orientation, disabled, required, invalid },
    reactNormalizer,
    {
      onValueChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onValueChange?.(next)
      },
      group: useFieldsetGroup() ?? undefined,
    }
  )

  return (
    <div {...api.rootProps}>
      {label && <span {...api.labelProps}>{label}</span>}
      <div {...api.listProps}>
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
