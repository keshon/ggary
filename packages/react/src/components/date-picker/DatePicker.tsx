import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import {
  connect as connectCalendar,
  createCalendarMachine,
  focusCalendarDay,
  toRange,
  type CalendarApi,
  type CalendarMode,
  type CalendarWords,
  type DateRange,
} from '@ggary/core/calendar'
import { connect, createDatePickerMachine, type DatePickerWords, type DatePreset } from '@ggary/core/date-picker'
import { attachPopover, joinDateTime, mergeProps, reactNormalizer, splitDateTime, type Dict, type ISODate, type ISODateTime, type ISOTime } from '@ggary/core'
import type { TimePickerWords } from '@ggary/core/time-picker'
import { TimePicker } from '../time-picker'
import type { ControlSize } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'
import { useConfigured } from '../config-provider'

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
    latest.current = next
    if (!controlled) setOwn(next)
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
      onReset={() => {
        if (!controlled) setOwn(initial.current)
      }}
      timeSlot={
        <TimePicker
          embedded
          label={timeLabel}
          size={size}
          locale={locale}
          step={step}
          value={parts.time}
          onValueChange={(time) => update({ time })}
          words={timeWords}
        />
      }
    />
  )
}

/** A field for a day or a range of days, typed or chosen from a calendar. */
function DateField(props: DateFieldProps & { timeSlot?: ReactNode; submitAs?: string; onReset?: () => void }) {
  const { size, label, value, defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, months, locale, name, placeholder, presets, words, timeSlot, submitAs, onReset } = props
  const id = `gg-date-${useId().replace(/:/g, '')}`
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
  const api = connect(state, machine.send, reactNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, presets, size })
  // Inside a Form, by name: the error its rules hold for this day.
  const form = useFormField(name, api.ids.input, label)
  callbacks.current.edited = () => form.edited(document.getElementById(api.ids.input))

  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', locale, mode, min, max, weekStart, isDateDisabled, months }),
    [machine, locale, mode, min, max, weekStart, isDateDisabled, months]
  )
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  }, [machine, value])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  useFormReset(inputRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(defaultValue) })
    onReset?.()
  })

  useLayoutEffect(() => {
    const positioner = positionerRef.current
    if (!state.open || !controlRef.current || !positioner) return
    const popover = attachPopover(controlRef.current, positioner, {
      placement: 'bottom-start',
      gutter: 4,
      sameWidth: false,
      onDismiss: () => machine.send({ type: 'CLOSE' }),
    })
    // Into the calendar, on its day.
    document.getElementById(api.calendar.focusedId)?.focus({ preventScroll: true })
    return () => {
      const active = document.activeElement
      const inside = !active || active === document.body || positioner.contains(active)
      popover.destroy()
      // Back to the field it came from, unless the person went elsewhere.
      if (inside) inputRef.current?.focus({ preventScroll: true })
    }
  }, [machine, state.open])

  useLayoutEffect(() => focusCalendarDay(gridRef.current, api.calendar.focusedId), [api.calendar.focusedId])

  return (
    <div {...api.rootProps}>
      {label && <label {...api.labelProps}>{label}</label>}
      <div ref={controlRef} {...api.controlProps}>
        <input ref={inputRef} {...mergeProps(api.inputProps, form.field.controlProps)} />
        <button {...api.triggerProps}>
          <span {...api.triggerIconProps} />
        </button>
        {timeSlot}
      </div>
      {api.invalid && <span {...api.errorProps}>{api.errorText}</span>}
      <span {...form.field.errorProps}>{form.error}</span>
      <div ref={positionerRef} {...api.positionerProps}>
        <div {...api.contentProps}>
          {state.open && (
            <>
              <CalendarView api={api.calendar} gridRef={gridRef} />
              {api.presets.length > 0 && (
                <div {...api.presetsProps}>
                  {api.presets.map(({ preset }) => (
                    <button key={preset.label} {...api.getPresetProps(preset)}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {name && <input {...mergeProps(api.hiddenInputProps, submitAs !== undefined ? { value: submitAs } : {})} />}
    </div>
  )
}
