import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject, type CSSProperties } from 'react'
import {
  connect as connectCalendar,
  createCalendarMachine,
  focusCalendarDay,
  isUnavailable,
  toRange,
  type CalendarApi,
  type CalendarMode,
  type CalendarWords,
  type DateRange,
} from '@ggary/core/calendar'
import { connect, createDatePickerMachine, type DatePickerWords, type DatePreset, type DatePickerEvent } from '@ggary/core/date-picker'
import { joinDateTime, mergeProps, reactNormalizer, splitDateTime, type Dict, type ISODate, type ISODateTime, type ISOTime } from '@ggary/core'
import type { TimePickerWords } from '@ggary/core/time-picker'
import { TimePicker, TimePickerComposition } from '../time-picker/TimePicker'
import { useCallback } from 'react'
import type { ControlSize } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'
import { useConfigured } from '../config-provider'
import { Popover as Primitive } from '@base-ui/react/popover'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
import { useFieldControl, useFieldComposition } from '../field/Field'
import { useFieldsetGroup } from '../fieldset/Fieldset'
import { SelectionConstraint } from '../../utils/selection-constraint'

interface CalendarOptionsProps {
  mode?: CalendarMode
  min?: ISODate | null
  max?: ISODate | null
  /** 0 Sunday … 6 Saturday. Default: the locale's. */
  weekStart?: number
  isDateDisabled?: (date: ISODate) => boolean
  /** How many months stand side by side: 1, or 2 for a range across a month's end. Default 1. */
  months?: 1 | 2
  locale?: string
}

/** The months and their grids, side by side: shared by Calendar and DatePicker. The first page has the way back, the last the way on. */
function CalendarView({ api, gridRef }: { api: CalendarApi<Dict>; gridRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div {...api.rootProps}>
      <div ref={gridRef} {...api.monthsProps}>
        {api.pages.map((page) => (
          <div key={page.page} {...api.getMonthProps(page.page)}>
            <div {...api.getHeaderProps(page.page)}>
              {page.first && (
                <button {...api.prevProps}>
                  <span {...api.prevIconProps} />
                </button>
              )}
              <div {...api.getTitleProps(page.page)}>{page.title}</div>
              {page.last && (
                <button {...api.nextProps}>
                  <span {...api.nextIconProps} />
                </button>
              )}
            </div>
            <table {...api.getGridProps(page.page)}>
              <thead {...api.headProps}>
                <tr {...api.headRowProps}>
                  {api.weekdays.map((day, index) => (
                    <th key={day.long} {...api.getWeekdayProps(index)}>
                      {day.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody {...api.bodyProps}>
                {page.weeks.map((week) => (
                  <tr key={week[0]} {...api.weekProps}>
                    {week.map((date) => (
                      <td key={date} {...api.getDayProps(date, page.page)}>
                        {api.isBlank(date, page.page) ? '' : api.dayText(date)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface CalendarProps extends CalendarOptionsProps {
  /** Controlled: a day, or `{ start, end }` for a range. */
  value?: ISODate | DateRange | null
  defaultValue?: ISODate | DateRange | null
  onValueChange?: (value: DateRange) => void
  /** The month to open on when nothing is chosen. */
  defaultMonth?: ISODate
  words?: CalendarWords
}

/** A month to choose a day, or a range, from — on the page itself. */
export function Calendar(props: CalendarProps) {
  props = useConfigured(props, { locale: true, words: 'calendar' })
  const { value, defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, months, locale, defaultMonth, words } = props
  const id = `gg-calendar-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }
  const [machine] = useState(() =>
    createCalendarMachine({
      id, value, defaultValue, mode, min, max, weekStart, isDateDisabled, months, locale, defaultMonth,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connectCalendar(state, machine.send, reactNormalizer, { ...words, locale })

  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', mode, min, max, weekStart, isDateDisabled, months }), [machine, mode, min, max, weekStart, isDateDisabled, months])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  }, [machine, value])

  const gridRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => focusCalendarDay(gridRef.current, api.focusedId), [api.focusedId])
  return <CalendarView api={api} gridRef={gridRef} />
}

interface DateFieldProps extends CalendarOptionsProps {
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  label?: string
  value?: ISODate | DateRange | null
  defaultValue?: ISODate | DateRange | null
  onValueChange?: (value: DateRange) => void
  /** Submits `YYYY-MM-DD`, or `YYYY-MM-DD/YYYY-MM-DD` for a range. */
  name?: string
  placeholder?: string
  /** Choices made in one press beside the calendar. `rangePresets()` gives the usual ones for a range. */
  presets?: DatePreset[]
  words?: DatePickerWords
}

/** A day and a time in one box: `time`, and the value is `YYYY-MM-DDTHH:mm`. */
export interface DateTimePickerProps extends Omit<DateFieldProps, 'mode' | 'value' | 'defaultValue' | 'onValueChange' | 'presets'> {
  time: true
  /** `YYYY-MM-DDTHH:mm`, a wall-clock day and time with no zone. Controlled; use `defaultValue` for uncontrolled. */
  value?: ISODateTime | null
  defaultValue?: ISODateTime | null
  /** The day and the time together once both are set; null while either is missing. */
  onValueChange?: (value: ISODateTime | null) => void
  /** Minutes between the times in the list. Default 15. */
  step?: number
  /** The time field's name for a screen reader. Default "Time". */
  timeLabel?: string
  timeWords?: TimePickerWords
}

export type DatePickerProps = (DateFieldProps & { time?: false }) | DateTimePickerProps

/** A field for a day or a range of days, typed or chosen from a calendar; with `time`, a day and a time. */
export function DatePicker(props: DatePickerProps) {
  props = useConfigured(props, { locale: true, size: true, words: 'datePicker' })
  if (props.time) return <DateTimeField {...props} />
  const { time: _time, ...rest } = props
  return <DateField {...rest} />
}

/**
 * The day's field and the time's, in one box. Each keeps its own state and
 * reports its half; this joins them, and submits the pair as one value.
 */
function DateTimeField(props: DateTimePickerProps) {
  const { value, defaultValue, onValueChange, step, timeLabel = 'Time', timeWords, time: _time, size, locale, name, ...rest } = props
  const field = useFieldControl()
  const group = useFieldsetGroup()
  const disabled = !!(rest.disabled || field?.disabled || group?.disabled)
  const readOnly = !!(rest.readOnly || field?.readOnly)
  const [timeMessage, setTimeMessage] = useState('')
  const reportTime = useCallback((message: string) => setTimeMessage(message), [])
  const controlled = value !== undefined
  const initial = useRef(splitDateTime(controlled ? value : defaultValue))
  const [own, setOwn] = useState(initial.current)
  const parts = controlled ? splitDateTime(value) : own
  const latest = useRef(parts)
  latest.current = parts
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }

  const update = (patch: { date?: ISODate | null; time?: ISOTime | null }) => {
    const next = { ...latest.current, ...patch }
    if (!controlled) { latest.current = next; setOwn(next) }
    callbacks.current.onValueChange?.(joinDateTime(next.date, next.time))
  }

  return (
    <DateField
      {...rest}
      size={size}
      locale={locale}
      name={name}
      mode="single"
      value={parts.date}
      onValueChange={(range) => update({ date: range.start })}
      submitAs={joinDateTime(parts.date, parts.time) ?? ''}
      timeMessage={timeMessage || (parts.date !== null && parts.time === null || parts.date === null && parts.time !== null ? 'Choose both a date and a time.' : '')}
      onReset={() => {
        if (!controlled) setOwn(splitDateTime(defaultValue))
      }}
      timeSlot={
        <TimePickerComposition.Provider value={{ disabled, readOnly, report: reportTime }}><TimePicker
          embedded
          label={timeLabel}
          size={size}
          locale={locale}
          step={step}
          value={parts.time}
          onValueChange={(time) => update({ time })}
          words={timeWords}
        /></TimePickerComposition.Provider>
      }
    />
  )
}

/** A field for a day or a range of days, typed or chosen from a calendar. */
function DateField(props: DateFieldProps & { timeSlot?: ReactNode; submitAs?: string; timeMessage?: string; onReset?: () => void }) {
  const { size, label, value, defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, months, locale, name: ownName, placeholder, presets, words, timeSlot, submitAs, timeMessage, onReset } = props
  const id = `gg-date-${useId().replace(/:/g, '')}`
  const field = useFieldControl()
  const composition = useFieldComposition()
  const group = useFieldsetGroup()
  const name = ownName ?? composition?.name
  const required = !!(props.required || field?.required)
  const disabled = !!(props.disabled || field?.disabled || group?.disabled)
  const readOnly = !!(props.readOnly || field?.readOnly)
  const controlId = String(field?.id ?? `${id}-input`)

  const callbacks = useRef<{ onValueChange?: typeof onValueChange; edited?: () => void }>({ onValueChange })
  callbacks.current.onValueChange = onValueChange
  const [machine] = useState(() =>
    createDatePickerMachine({
      id, value, defaultValue, mode, min, max, weekStart, isDateDisabled, months, locale,
      onValueChange: (next) => {
        callbacks.current.onValueChange?.(next)
        callbacks.current.edited?.()
      },
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const send = (event: DatePickerEvent) => {
    if (disabled && event.type !== 'CLOSE') return
    if (readOnly && (event.type === 'INPUT' || event.type === 'COMMIT_TEXT' ||
      (event.type === 'CALENDAR' && ['SELECT', 'SET', 'CLEAR'].includes(event.event.type)))) return
    machine.send(event)
  }
  const api = connect(state, send, reactNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, presets, size })
  // Inside a Form, by name: the error its rules hold for this day.
  const form = useFormField(composition?.name ? undefined : name, controlId, field?.['aria-labelledby'] ? undefined : label)
  callbacks.current.edited = undefined

  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', locale, mode, min, max, weekStart, isDateDisabled, months }),
    [machine, locale, mode, min, max, weekStart, isDateDisabled, months]
  )
  useEffect(() => {
    if (value !== undefined) {
      const accepted = toRange(value)
      if (accepted.start !== state.calendar.value.start || accepted.end !== state.calendar.value.end) machine.send({ type: 'SYNC_VALUE', value: accepted })
    }
  }, [machine, value, state.calendar.value.start, state.calendar.value.end])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  useFormReset(inputRef, () => {
    machine.send({ type: 'RESET', value: toRange(value !== undefined ? value : defaultValue) })
    onReset?.()
  })

  const selected = state.calendar.value
  const incomplete = !!selected.start && state.calendar.mode === 'range' && !selected.end
  const unavailable = [selected.start, selected.end].some(date => date !== null && isUnavailable(state.calendar, date))
  // Drafts are accepted on blur/Enter. A programmatic submit must not silently use an older value.
  const message = timeMessage || (state.invalid ? api.errorText : state.editing ? 'Confirm the typed date with Enter or leave the field.'
    : incomplete ? 'Choose both dates.' : unavailable ? 'Choose an available date.' : '')
  const { required: _fieldRequired, readOnly: _fieldReadOnly, ...metadata } = field ?? {}
  const describedBy = [api.inputProps['aria-describedby'], metadata['aria-describedby'], form.field.controlProps['aria-describedby']].filter(Boolean).join(' ') || undefined
  const environment = useOverlayEnvironment(controlRef, state.open)
  const { onClick: _legacyToggle, ...triggerProps } = api.triggerProps
  const { popover: _nativePopover, ...positionerProps } = api.positionerProps
  // Changing the positioning anchor can restart Base UI's focus manager while
  // open. Restore to the text field only when this visit actually ends.
  const finalFocus = () => machine.getState().open ? false : inputRef.current

  useLayoutEffect(() => focusCalendarDay(gridRef.current, api.calendar.focusedId), [api.calendar.focusedId])

  return (
    <DirectionProvider direction={environment.dir ?? 'ltr'}>
    <Primitive.Root open={state.open} modal={false} onOpenChange={next => send({ type: next ? 'OPEN' : 'CLOSE' })}>
    <div {...api.rootProps}>
      {label && !field?.['aria-labelledby'] && <label {...api.labelProps} htmlFor={controlId}>{label}</label>}
      <div ref={controlRef} {...api.controlProps}>
        <input ref={inputRef} {...mergeProps(api.inputProps, form.field.controlProps, metadata)} id={controlId}
          disabled={disabled} readOnly={readOnly} aria-required={required || undefined} aria-describedby={describedBy} />
        <Primitive.Trigger {...triggerProps} disabled={disabled}>
          <span {...api.triggerIconProps} />
        </Primitive.Trigger>
        {timeSlot}
      </div>
      {api.invalid && <span {...api.errorProps}>{api.errorText}</span>}
      <span {...form.field.errorProps}>{form.error}</span>
      <Primitive.Portal keepMounted container={environment.container}>
        <Primitive.Positioner {...positionerProps} anchor={controlRef} side="bottom" align="start" sideOffset={4}
          positionMethod="fixed" data-backend="base-ui" data-mode={environment.mode} dir={environment.dir} lang={environment.locale}
          style={{ ...environment.style, '--gg-available-height': 'var(--available-height, 320px)' } as CSSProperties}>
        <Primitive.Popup ref={contentRef} {...api.contentProps} data-backend="base-ui" finalFocus={finalFocus}
          initialFocus={() => document.getElementById(api.calendar.focusedId) ?? contentRef.current}>
          {state.open && (
            <>
              <CalendarView api={api.calendar} gridRef={gridRef} />
              {api.presets.length > 0 && (
                <div {...api.presetsProps}>
                  {api.presets.map(({ preset }) => (
                    <button key={preset.label} {...api.getPresetProps(preset)} {...(readOnly ? { disabled: true } : {})}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
      <SelectionConstraint id={`${id}-constraint`} controlId={controlId} name={name}
        value={submitAs ?? String(api.hiddenInputProps.value ?? '')} required={required} disabled={disabled} readOnly={readOnly}
        message={message} focusTarget={inputRef} onValidityChange={() => {
          composition?.edited()
          if (!composition?.name) form.edited(inputRef.current)
          group?.refresh()
        }} />
    </div>
    </Primitive.Root>
    </DirectionProvider>
  )
}
