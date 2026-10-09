import { useId, useRef, useState, type CSSProperties } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { Select as Primitive } from '@base-ui/react/select'
import { mergeProps } from '@base-ui/react/merge-props'
import { useConfigured } from '../config-provider'
import { useFieldControl, useFieldComposition } from '../field/Field'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { useFormField } from '../form/Form'
import { useFormReset } from '../../utils/use-form-reset'
import type { ControlSize } from '@ggary/core'
import type { SelectItem } from '@ggary/core/select'

export interface SelectProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  items: SelectItem[]
  label?: string
  placeholder?: string
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  disabled?: boolean
  required?: boolean
  readOnly?: boolean
  name?: string
  onValueChange?: (value: string | null, item: SelectItem | null) => void
}

/** React interaction backend. Keeps GGary's public value/item and styling contract. */
export function Select(props: SelectProps) {
  const { size = 'md', items, label, placeholder = 'Select…', value, defaultValue, disabled: ownDisabled, required: ownRequired, readOnly: ownReadOnly, name: ownName, onValueChange } = useConfigured(props, { size: true })
  const id = `gg-base-select-${useId().replace(/:/g, '')}`
  const field = useFieldControl()
  const composition = useFieldComposition()
  const group = useFieldsetGroup()
  const name = composition?.name ?? ownName
  const disabled = Boolean(ownDisabled || field?.disabled || group?.disabled)
  const required = Boolean(ownRequired || field?.required)
  const readOnly = Boolean(ownReadOnly || field?.readOnly)
  const triggerId = (field?.id as string | undefined) ?? `${id}-trigger`
  const trigger = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [localValue, setLocalValue] = useState(defaultValue ?? null)
  const [open, setOpen] = useState(false)
  const selected = value === undefined ? localValue : value
  const selectedItem = items.find((item) => item.value === selected)
  const form = useFormField(composition?.name ? undefined : name, triggerId, label)
  useFormReset(trigger, () => { if (value === undefined) setLocalValue(defaultValue ?? null); setOpen(false) })
  const part = (name: string) => ({ 'data-scope': 'select', 'data-part': name, 'data-backend': 'base-ui' })
  const state = open ? 'open' : 'closed'
  const environment = useOverlayEnvironment(trigger, open)

  return <DirectionProvider direction={environment.dir ?? 'ltr'}><Primitive.Root<string> items={items} value={selected} disabled={disabled} required={required} readOnly={readOnly} name={name} open={open} onOpenChange={setOpen} modal={false}
    onValueChange={(next) => {
      if (value === undefined) setLocalValue(next)
      onValueChange?.(next, items.find((item) => item.value === next) ?? null)
      if (composition?.name) composition.edited()
      else form.edited(trigger.current)
    }}>
    <div ref={root} {...part('root')} data-size={size} data-state={state} data-disabled={disabled ? '' : undefined}>
      {label && !field && <label {...part('label')} id={`${id}-label`} htmlFor={triggerId} data-disabled={disabled ? '' : undefined}>{label}</label>}
      <Primitive.Trigger ref={trigger} {...mergeProps(form.field.controlProps, field ?? {}, { id: triggerId, 'aria-labelledby': field?.['aria-labelledby'] as string | undefined ?? (label ? `${id}-label` : undefined) })} {...part('trigger')} data-state={state}>
        <Primitive.Value {...part('value')} placeholder={placeholder} data-placeholder={selectedItem ? undefined : ''}>
          {selectedItem?.label ?? placeholder}
        </Primitive.Value>
        <Primitive.Icon {...part('indicator')} data-icon="chevron-down" aria-hidden="true" data-state={state}>{''}</Primitive.Icon>
      </Primitive.Trigger>
      {!composition?.name && <span {...form.field.errorProps}>{form.error}</span>}
    </div>
    <Primitive.Portal container={environment.container}>
      <Primitive.Positioner {...part('positioner')} positionMethod="fixed" sideOffset={4} alignItemWithTrigger={false} data-mode={environment.mode} dir={environment.dir} lang={environment.locale} style={{ ...environment.style, '--gg-anchor-width': 'var(--anchor-width, 200px)', '--gg-available-height': 'var(--available-height, 280px)' } as CSSProperties}>
        <Primitive.Popup {...part('content')}>
          {items.length === 0 && <div {...part('empty')}>No options</div>}
          {items.map((item) => <Primitive.Item key={item.value} value={item.value} label={item.label} disabled={item.disabled} {...part('item')}>
            <Primitive.ItemText {...part('item-text')}>{item.label}</Primitive.ItemText>
            <Primitive.ItemIndicator keepMounted {...part('item-indicator')} data-icon="check" aria-hidden="true">{''}</Primitive.ItemIndicator>
          </Primitive.Item>)}
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  </Primitive.Root></DirectionProvider>
}
