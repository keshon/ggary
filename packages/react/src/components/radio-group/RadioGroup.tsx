import { useId, useLayoutEffect, useRef, useState } from 'react'
import { RadioGroup as PrimitiveGroup } from '@base-ui/react/radio-group'
import { Radio as Primitive } from '@base-ui/react/radio'
import { radioGroupAnatomy, type RadioGroupOrientation, type RadioItem } from '@ggary/core/radio-group'
import { choiceGroupFrame } from '@ggary/core'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormField } from '../form/Form'
import { useFormReset } from '../../utils/use-form-reset'
import { useChoiceInputMetadata } from '../../utils/use-choice-input-metadata'

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

function RadioOption({ item, id, checked, disabled, invalid, required }: {
  item: RadioItem; id: string; checked: boolean; disabled: boolean; invalid: boolean; required: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const attrs = { 'data-state': checked ? 'checked' : 'unchecked', 'data-disabled': disabled ? '' : undefined, 'data-invalid': invalid ? '' : undefined }
  const part = (part: string) => ({ 'data-scope': 'radio', 'data-part': part, 'data-backend': 'base-ui' })
  useChoiceInputMetadata(input, { ...part('input'), ...attrs, 'aria-invalid': invalid ? 'true' : undefined })
  return <label {...part('root')} {...attrs} htmlFor={id}>
    <span {...part('control')} {...attrs}>
      <Primitive.Root {...part('toggle')} {...attrs} value={item.value} id={id} inputRef={input}
        disabled={disabled} required={required} aria-labelledby={`${id}-label`}
        render={toggleProps => <span {...toggleProps} aria-invalid={invalid || undefined} data-invalid={invalid ? '' : undefined} />}>
        <Primitive.Indicator keepMounted {...part('indicator')} {...attrs} aria-hidden="true" />
      </Primitive.Root>
    </span>
    <span {...part('label')} {...attrs} id={`${id}-label`}>{item.label}</span>
  </label>
}

export function RadioGroup(props: RadioGroupProps) {
  const { items, name, value, defaultValue = null, onValueChange, label, orientation, disabled, required, invalid } = props
  const id = `gg-radio-${useId().replace(/:/g, '')}`
  const group = useFieldsetGroup()
  const fieldName = name || group?.name
  const form = useFormField(fieldName === group?.name ? undefined : fieldName, id, label)
  const [own, setOwn] = useState(defaultValue)
  const resolved = value === undefined ? own : value
  const frame = choiceGroupFrame(radioGroupAnatomy, { id, role: 'radiogroup', label, orientation, disabled, required, invalid: Boolean(invalid || form.error), group: group ?? undefined })
  const root = useRef<HTMLDivElement>(null)
  useFormReset(root, () => setOwn(defaultValue))
  useLayoutEffect(() => {
    const inputs = [...(root.current?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])]
    inputs.forEach(input => input.setCustomValidity(''))
    const eligible = inputs.filter(input => !input.matches(':disabled'))
    // Native required radios can count a checked disabled sibling even though
    // it submits nothing. Reject that non-submittable selection explicitly.
    eligible[0]?.setCustomValidity(frame.required && inputs.some(input => input.checked) && !eligible.some(input => input.checked)
      ? 'Choose an available option.' : '')
    group?.refresh()
  })
  return <PrimitiveGroup<string | null> ref={root} {...frame.rootProps} data-backend="base-ui" tabIndex={fieldName ? -1 : undefined} aria-describedby={form.field.controlProps['aria-describedby'] as string | undefined} value={resolved}
    name={name || group?.name || id} disabled={frame.disabled} required={frame.required}
    render={rootProps => <div {...rootProps} role={frame.rootProps.role as 'radiogroup' | undefined}
      aria-invalid={frame.invalid || undefined} />}
    onValueChange={next => { if (next === null) return; if (value === undefined) setOwn(next); onValueChange?.(next) }}>
    {label && <span {...frame.labelProps}>{label}</span>}
    <div {...frame.listProps}>
      {items.map((item, index) => <RadioOption key={item.value} item={item} id={frame.ids.item(index)}
        checked={item.value === resolved} disabled={Boolean(frame.disabled || item.disabled)} invalid={frame.invalid} required={frame.required} />)}
    </div>
    <span {...form.field.errorProps}>{form.error}</span>
  </PrimitiveGroup>
}
