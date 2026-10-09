import { useId, useLayoutEffect, useRef, useState } from 'react'
import { CheckboxGroup as Primitive } from '@base-ui/react/checkbox-group'
import type { CheckboxGroupOrientation, CheckboxItem } from '@ggary/core/checkbox-group'
import { checkboxGroupAnatomy } from '@ggary/core/checkbox-group'
import { choiceGroupFrame } from '@ggary/core'
import { Checkbox } from '../checkbox/Checkbox'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormField } from '../form/Form'
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
  const { items, name, value, defaultValue = [], onValueChange, label, orientation, disabled, required, invalid, requiredMessage } = props
  const id = `gg-checkboxes-${useId().replace(/:/g, '')}`
  const group = useFieldsetGroup()
  const fieldName = name || group?.name
  const form = useFormField(fieldName === group?.name ? undefined : fieldName, id, label)
  const [own, setOwn] = useState(defaultValue)
  const resolved = value ?? own
  const frame = choiceGroupFrame(checkboxGroupAnatomy, { id, role: 'group', label, orientation, disabled, required, invalid: Boolean(invalid || form.error), group: group ?? undefined })
  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => setOwn(defaultValue))
  // A group constraint, never `required` on every checkbox. Read the committed
  // native inputs so disabled selections cannot satisfy required submission.
  useLayoutEffect(() => {
    const inputs = [...(root.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [])]
    inputs.forEach(input => input.setCustomValidity(''))
    const eligible = inputs.filter(input => !input.matches(':disabled'))
    eligible[0]?.setCustomValidity(frame.required && !eligible.some(input => input.checked) ? requiredMessage ?? 'Select at least one option.' : '')
    group?.refresh()
  })
  return <Primitive ref={root} {...frame.rootProps} data-backend="base-ui" tabIndex={fieldName ? -1 : undefined} aria-describedby={form.field.controlProps['aria-describedby'] as string | undefined} disabled={frame.disabled} value={resolved}
    render={rootProps => <div {...rootProps} role={frame.rootProps.role as 'group' | undefined}
      aria-invalid={frame.invalid || undefined} />}
    onValueChange={next => {
      const ordered = items.filter(item => next.includes(item.value)).map(item => item.value)
      if (value === undefined) setOwn(ordered)
      onValueChange?.(ordered)
    }}>
    {label && <span {...frame.labelProps}>{label}</span>}
    <div {...frame.listProps}>
      {items.map((item, index) => <Checkbox key={item.value} id={frame.ids.item(index)} name={name || group?.name || id}
        value={item.value} checked={resolved.includes(item.value)} disabled={frame.disabled || item.disabled}
        invalid={frame.invalid}>{item.label}</Checkbox>)}
    </div>
    <span {...form.field.errorProps}>{form.error}</span>
  </Primitive>
}
