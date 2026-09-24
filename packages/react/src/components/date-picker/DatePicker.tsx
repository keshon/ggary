import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
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
import { attachPopover, mergeProps, reactNormalizer, type Dict, type ISODate } from '@ggary/core'
import { useFormReset } from '../../utils/use-form-reset'
import { useFormField } from '../form/Form'

interface CalendarOptionsProps {
  mode?: CalendarMode
  min?: ISODate | null
  max?: ISODate | null
  /** 0 Sunday … 6 Saturday. Default: the locale's. */
  weekStart?: number
  isDateDisabled?: (date: ISODate) => boolean
  locale?: string
}

/** The month and its grid: shared by Calendar and DatePicker. */
function CalendarView({ api, gridRef }: { api: CalendarApi<Dict>; gridRef: RefObject<HTMLTableElement | null> }) {
  return (
    <div {...api.rootProps}>
      <div {...api.headerProps}>
        <button {...api.prevProps}>
          <span {...api.prevIconProps} />
        </button>
        <div {...api.titleProps}>{api.title}</div>
        <button {...api.nextProps}>
          <span {...api.nextIconProps} />
        </button>
      </div>
      <table ref={gridRef} {...api.gridProps}>
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
          {api.weeks.map((week) => (
            <tr key={week[0]} {...api.weekProps}>
              {week.map((date) => (
                <td key={date} {...api.getDayProps(date)}>
                  {api.dayText(date)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
  const { value, defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, locale, defaultMonth, words } = props
  const id = `gg-calendar-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }
  const [machine] = useState(() =>
    createCalendarMachine({
      id, value, defaultValue, mode, min, max, weekStart, isDateDisabled, locale, defaultMonth,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connectCalendar(state, machine.send, reactNormalizer, { ...words, locale })

  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', mode, min, max, weekStart, isDateDisabled }), [machine, mode, min, max, weekStart, isDateDisabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  }, [machine, value])

  const gridRef = useRef<HTMLTableElement>(null)
  useLayoutEffect(() => focusCalendarDay(gridRef.current, api.focusedId), [api.focusedId])
  return <CalendarView api={api} gridRef={gridRef} />
}

export interface DatePickerProps extends CalendarOptionsProps {
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

/** A field for a day or a range of days, typed or chosen from a calendar. */
export function DatePicker(props: DatePickerProps) {
  const { label, value, defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, locale, name, placeholder, presets, words } = props
  const id = `gg-date-${useId().replace(/:/g, '')}`
  const callbacks = useRef<{ onValueChange?: typeof onValueChange; edited?: () => void }>({ onValueChange })
  callbacks.current.onValueChange = onValueChange
  const [machine] = useState(() =>
    createDatePickerMachine({
      id, value, defaultValue, mode, min, max, weekStart, isDateDisabled, locale,
      onValueChange: (next) => {
        callbacks.current.onValueChange?.(next)
        callbacks.current.edited?.()
      },
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, presets })
  // Inside a Form, by name: the error its rules hold for this day.
  const form = useFormField(name, api.ids.input, label)
  callbacks.current.edited = () => form.edited(document.getElementById(api.ids.input))

  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', locale, mode, min, max, weekStart, isDateDisabled }),
    [machine, locale, mode, min, max, weekStart, isDateDisabled]
  )
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  }, [machine, value])

  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const positionerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLTableElement>(null)
  useFormReset(inputRef, () => {
    if (value === undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(defaultValue) })
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
      {name && <input {...api.hiddenInputProps} />}
    </div>
  )
}
