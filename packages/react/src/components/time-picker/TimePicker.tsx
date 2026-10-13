import { createContext, useContext, useLayoutEffect, useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { connect, createTimePickerMachine, isUnavailable, type TimePickerEvent, type TimePickerWords } from '@ggary/core/time-picker'
import { nowTime, mergeProps, reactNormalizer, scrollIntoCenter, scrollIntoViewIfNeeded, type ControlSize, type ISOTime } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'
import { useConfigured } from '../config-provider'
import { Combobox as Primitive } from '@base-ui/react/combobox'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { Field as BaseField } from '@base-ui/react/field'
import { useFieldControl, useFieldComposition } from '../field/Field'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { SelectionConstraint } from '../../utils/selection-constraint'

// Private compound-picker contract; embedded time does not own the enclosing Field.
export const TimePickerComposition = createContext<{ disabled: boolean; readOnly: boolean; report: (message: string) => void } | null>(null)

export interface TimePickerProps {
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
  fullWidth?: boolean
  label?: string
  /** `HH:mm`. Controlled; use `defaultValue` for uncontrolled. */
  value?: ISOTime | null
  defaultValue?: ISOTime | null
  onValueChange?: (value: ISOTime | null) => void
  /** Minutes between the times in the list. Default 15. */
  step?: number
  min?: ISOTime
  max?: ISOTime
  /** A time the owner refuses: shown in the list, faded, and not chosen. */
  isTimeDisabled?: (time: ISOTime) => boolean
  /** The clock to read and write in: twelve hours or twenty-four follows it. */
  locale?: string
  /** Submits the time as `HH:mm`. */
  name?: string
  placeholder?: string
  words?: TimePickerWords
  /** Inside another field's box, as DatePicker's time: no label or box of its own; `label` names the input. */
  embedded?: boolean
}

/** A field for a time of day, typed or chosen from a list of times at a step. */
export function TimePicker(props: TimePickerProps) {
  props = useConfigured(props, { locale: true, size: true, words: 'timePicker' })
  const { size, label, value, defaultValue, onValueChange, step, min, max, isTimeDisabled, locale, name: ownName, placeholder, words, embedded, fullWidth } = props
  const id = `gg-time-${useId().replace(/:/g, '')}`
  const outerField = useFieldControl()
  const outerComposition = useFieldComposition()
  const compound = useContext(TimePickerComposition)
  const group = useFieldsetGroup()
  const field = embedded ? null : outerField
  const composition = embedded ? null : outerComposition
  const name = embedded ? undefined : ownName ?? composition?.name
  const required = !embedded && !!(props.required || field?.required)
  const disabled = !!(props.disabled || outerField?.disabled || group?.disabled || compound?.disabled)
  const readOnly = !!(props.readOnly || outerField?.readOnly || compound?.readOnly)
  const controlId = String(field?.id ?? `${id}-input`)
  const callbacks = useRef<{ onValueChange?: typeof onValueChange; edited?: () => void }>({ onValueChange })
  callbacks.current.onValueChange = onValueChange
  const [machine] = useState(() =>
    createTimePickerMachine({
      id, value, defaultValue, step, min, max, isTimeDisabled, locale,
      onValueChange: (next) => {
        callbacks.current.onValueChange?.(next)
        callbacks.current.edited?.()
      },
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const send = (event: TimePickerEvent) => {
    if (disabled && event.type !== 'CLOSE') return
    if (readOnly && ['INPUT', 'COMMIT_TEXT', 'CHOOSE', 'CLEAR'].includes(event.type)) return
    machine.send(event)
  }
  const api = connect(state, send, reactNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, size, embedded, label })
  // Inside a Form, by name: the error its rules hold for this time.
  const form = useFormField(composition?.name ? undefined : name, controlId, field?.['aria-labelledby'] ? undefined : label)
  callbacks.current.edited = undefined

  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', locale, step, min, max, isTimeDisabled }), [machine, locale, step, min, max, isTimeDisabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value, state.value])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useFormReset(inputRef, () => {
    machine.send({ type: 'RESET', value: value !== undefined ? value : defaultValue ?? null })
  })

  const message = state.invalid ? api.errorText : state.editing ? 'Confirm the typed time with Enter or leave the field.'
    : state.value && isUnavailable(state, state.value) ? 'Choose an available time.' : ''
  useLayoutEffect(() => { if (embedded) compound?.report(message) }, [embedded, compound?.report, message])
  const { required: _fieldRequired, readOnly: _fieldReadOnly, ...metadata } = field ?? {}
  const describedBy = [api.inputProps['aria-describedby'], metadata['aria-describedby'], form.field.controlProps['aria-describedby'], embedded ? outerField?.['aria-describedby'] : undefined].filter(Boolean).join(' ') || undefined
  const environment = useOverlayEnvironment(controlRef, state.open)
  const { popover: _nativePopover, ...positionerProps } = api.positionerProps
  const { onClick: _legacyToggle, ...triggerProps } = api.triggerProps
  const { onInput: _legacyInput, onKeyDown, value: text, ...inputProps } = api.inputProps

  // Opening, the list stands its time in the middle; walking, it scrolls no more than it must.
  const wasOpen = useRef(false)
  useEffect(() => {
    const opening = state.open && !wasOpen.current
    wasOpen.current = state.open
    if (!state.open || !state.highlighted) return
    const item = document.getElementById(api.ids.item(state.highlighted))
    if (opening) scrollIntoCenter(item, contentRef.current)
    else scrollIntoViewIfNeeded(item, contentRef.current)
  }, [api.ids, state.open, state.highlighted])

  return (
    <DirectionProvider direction={environment.dir ?? 'ltr'}>
      <BaseField.Root render={rootProps => <div {...rootProps} style={{ display: 'contents' }} />}>
      <Primitive.Root<ISOTime> open={state.open} modal={false} value={state.value} disabled={disabled} readOnly={readOnly}
        items={api.times.map(item => item.time)} filteredItems={api.times.map(item => item.time)}
        inputValue={text} itemToStringLabel={time => api.times.find(item => item.time === time)?.label ?? time}
        onInputValueChange={(text, details) => {
          if (details.reason === 'input-change') send({ type: 'INPUT', text })
        }}
        onOpenChange={next => send(next ? { type: 'OPEN', now: nowTime() } : { type: 'CLOSE' })}
        onOpenChangeComplete={open => {
          const highlighted = machine.getState().highlighted
          if (open && highlighted) scrollIntoCenter(document.getElementById(api.ids.item(highlighted)), contentRef.current)
        }}>
    <div {...api.rootProps} data-full-width={fullWidth ? '' : undefined}>
      {label && !embedded && !field?.['aria-labelledby'] && <label {...api.labelProps} htmlFor={controlId}>{label}</label>}
      <div ref={controlRef} {...api.controlProps}>
        <Primitive.Input ref={inputRef} {...mergeProps(inputProps, form.field.controlProps, metadata)} id={controlId} disabled={disabled} readOnly={readOnly} aria-required={required || undefined} aria-describedby={describedBy}
          onKeyDown={event => {
            // Let Base UI consume popup Escape before an ancestor Dialog sees it.
            if (event.key === 'Escape' && state.open) return
            // The time machine distinguishes a typed off-step time from a walked option.
            event.preventBaseUIHandler()
            onKeyDown?.(event)
          }} />
        <Primitive.Trigger {...triggerProps} disabled={disabled}>
          <span {...api.triggerIconProps} />
        </Primitive.Trigger>
      </div>
      {api.invalid && <span {...api.errorProps}>{api.errorText}</span>}
      <span {...form.field.errorProps}>{form.error}</span>

      <Primitive.Portal keepMounted container={environment.container}>
        <Primitive.Positioner {...positionerProps} anchor={controlRef} side="bottom" align="start" sideOffset={4}
          positionMethod="fixed" data-backend="base-ui" data-mode={environment.mode} dir={environment.dir} lang={environment.locale}
          style={{ ...environment.style, width: 'var(--anchor-width)', '--gg-available-height': 'var(--available-height, 320px)' } as CSSProperties}>
        <Primitive.Popup data-backend="base-ui" initialFocus={false} finalFocus={false}>
          <Primitive.List ref={contentRef} {...api.contentProps}>
          {state.open &&
            api.times.map(({ time, label: words }) => (
              <div key={time} {...api.getItemProps(time)}>
                {words}
              </div>
            ))}
          </Primitive.List>
        </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </div>
      </Primitive.Root>
      </BaseField.Root>
      {!embedded && <SelectionConstraint id={`${id}-constraint`} controlId={controlId} name={name}
        value={state.value ?? ''} required={required} disabled={disabled} readOnly={readOnly}
        message={message} focusTarget={inputRef} onValidityChange={() => {
          composition?.edited()
          if (!composition?.name) form.edited(inputRef.current)
          group?.refresh()
        }} />}
    </DirectionProvider>
  )
}
