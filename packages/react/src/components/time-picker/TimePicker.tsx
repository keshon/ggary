import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { connect, createTimePickerMachine, type TimePickerWords } from '@ggary/core/time-picker'
import { attachPopover, mergeProps, reactNormalizer, scrollIntoCenter, scrollIntoViewIfNeeded, type ControlSize, type ISOTime } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'

export interface TimePickerProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
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
  const { size, label, value, defaultValue, onValueChange, step, min, max, isTimeDisabled, locale, name, placeholder, words, embedded } = props
  const id = `gg-time-${useId().replace(/:/g, '')}`
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
  const api = connect(state, machine.send, reactNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, size, embedded, label })
  // Inside a Form, by name: the error its rules hold for this time.
  const form = useFormField(name, api.ids.input, label)
  callbacks.current.edited = () => form.edited(document.getElementById(api.ids.input))

  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', locale, step, min, max, isTimeDisabled }), [machine, locale, step, min, max, isTimeDisabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useFormReset(inputRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: defaultValue ?? null })
  })

  useLayoutEffect(() => {
    if (!state.open || !controlRef.current || !positionerRef.current) return
    // The focus stays in the field: placement and dismissal only.
    const popover = attachPopover(controlRef.current, positionerRef.current, {
      sameWidth: true,
      gutter: 4,
      onDismiss: () => machine.send({ type: 'CLOSE' }),
    })
    return () => popover.destroy()
  }, [machine, state.open])

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
    <div {...api.rootProps}>
      {label && !embedded && <label {...api.labelProps}>{label}</label>}
      <div ref={controlRef} {...api.controlProps}>
        <input ref={inputRef} {...mergeProps(api.inputProps, form.field.controlProps)} />
        <button {...api.triggerProps}>
          <span {...api.triggerIconProps} />
        </button>
      </div>
      {api.invalid && <span {...api.errorProps}>{api.errorText}</span>}
      <span {...form.field.errorProps}>{form.error}</span>
      {name && <input {...api.hiddenInputProps} />}
      <div ref={positionerRef} {...api.positionerProps}>
        <div ref={contentRef} {...api.contentProps}>
          {state.open &&
            api.times.map(({ time, label: words }) => (
              <div key={time} {...api.getItemProps(time)}>
                {words}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
