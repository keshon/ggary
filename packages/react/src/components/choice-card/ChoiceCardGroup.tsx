import { useId, useRef, useState } from 'react'
import { connect, type ChoiceCardItem, type ChoiceCardType, type ChoiceGroupOrientation } from '@ggary/core/choice-card'
import { reactNormalizer } from '@ggary/core'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormReset } from '../../utils/use-form-reset'

export interface ChoiceCardGroupProps {
  items: ChoiceCardItem[]
  /** radio when the options exclude one another (the default), checkbox when they do not. */
  type?: ChoiceCardType
  name?: string
  /** Controlled: a string for radios, an array for checkboxes. Omit for uncontrolled. */
  value?: string | string[] | null
  defaultValue?: string | string[] | null
  onValueChange?: (value: any) => void
  label?: string
  orientation?: ChoiceGroupOrientation
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}

export function ChoiceCardGroup(props: ChoiceCardGroupProps) {
  const { items, type = 'radio', name, value, onValueChange, label, orientation, disabled, required, invalid } = props
  const id = `gg-choice-cards-${useId().replace(/:/g, '')}`
  const empty = type === 'checkbox' ? [] : null
  const defaultValue = props.defaultValue ?? empty

  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const controlled = value !== undefined

  const api = connect(
    { id, items, type, name, value: controlled ? value : uncontrolled, label, orientation, disabled, required, invalid },
    reactNormalizer,
    {
      onValueChange: (next) => {
        if (!controlled) setUncontrolled(next)
        onValueChange?.(next)
      },
      // React puts a controlled input back after every event; see utils/choice.
      restoresChecked: true,
      group: useFieldsetGroup() ?? undefined,
    }
  )

  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => setUncontrolled(defaultValue))

  return (
    <div ref={root} {...api.rootProps}>
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
              <span {...parts.bodyProps}>
                <span {...parts.titleProps}>{item.title}</span>
                {parts.showDescription && <span {...parts.descriptionProps}>{item.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
