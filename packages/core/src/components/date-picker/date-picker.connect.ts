import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { dateOrder, formatDate, todayISO } from '../../utils/calendar'
import { connect as connectCalendar } from '../calendar/calendar.connect'
import { isUnavailable } from '../calendar/calendar.machine'
import type { CalendarState, DateRange } from '../calendar/calendar.types'
import { datePickerAnatomy } from './date-picker.anatomy'
import type { DatePickerConnectOptions, DatePickerEvent, DatePickerState, DatePreset } from './date-picker.types'

/** What stands in the field when nobody is typing: the chosen day, or range, in the locale's words. */
export function displayValue(value: DateRange, mode: CalendarState['mode'], locale?: string): string {
  if (!value.start) return ''
  if (mode === 'single' || !value.end) return formatDate(value.start, locale)
  return `${formatDate(value.start, locale)} – ${formatDate(value.end, locale)}`
}

export const datePickerIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  input: `${id}-input`,
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  error: `${id}-error`,
})

/** A day written the way the locale writes it in numbers: "18.09.2026", "9/18/2026". */
export function exampleDate(locale?: string): string {
  const numbers: Record<string, string> = { day: '18', month: '09', year: '2026' }
  const order = dateOrder(locale)
  const separator = formatDate('2026-09-18', locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\d/g, '').charAt(0) || '.'
  return order.map((part) => numbers[part]).join(separator)
}

export function connect<T = Dict>(state: DatePickerState, send: (event: DatePickerEvent) => void, normalize: Normalizer<T>, options: DatePickerConnectOptions = {}) {
  const ids = datePickerIds(state.id)
  const anatomy = datePickerAnatomy
  const locale = options.locale ?? state.locale
  const value = state.calendar.value
  const range = state.calendar.mode === 'range'
  const shown = state.editing ? state.text : displayValue(value, state.calendar.mode, locale)
  const example = range ? `${exampleDate(locale)} – ${exampleDate(locale)}` : exampleDate(locale)
  const calendar = connectCalendar(state.calendar, (event) => send({ type: 'CALENDAR', event }), normalize, { ...options, locale })

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && state.editing) {
      // A typed day is committed, not the form submitted.
      event.preventDefault()
      send({ type: 'COMMIT_TEXT' })
    } else if (event.key === 'ArrowDown' && (event.altKey || !state.editing)) {
      event.preventDefault()
      send({ type: 'OPEN' })
    } else if (event.key === 'Escape' && state.editing) {
      event.preventDefault()
      send({ type: 'INPUT', text: displayValue(value, state.calendar.mode, locale) })
      send({ type: 'COMMIT_TEXT' })
    }
  }

  const submitted = !value.start ? '' : range && value.end ? `${value.start}/${value.end}` : value.start

  return {
    ids,
    open: state.open,
    value,
    invalid: state.invalid,
    calendar,
    today: todayISO(),
    errorText: state.invalid ? (options.invalid ?? ((sample: string) => `Enter a date like ${sample}`))(example) : '',
    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-size': options.size ?? 'md',
      'data-state': state.open ? 'open' : 'closed',
      'data-mode': state.calendar.mode,
      'data-invalid': state.invalid ? '' : undefined,
    }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, htmlFor: ids.input }),
    controlProps: normalize({ ...anatomy.attrs('control'), 'data-state': state.open ? 'open' : 'closed', 'data-invalid': state.invalid ? '' : undefined }),
    inputProps: normalize({
      ...anatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      autoComplete: 'off',
      spellCheck: false,
      placeholder: options.placeholder ?? example,
      value: shown,
      'aria-invalid': state.invalid ? 'true' : undefined,
      'aria-describedby': state.invalid ? ids.error : undefined,
      onInput: (event: Event) => send({ type: 'INPUT', text: (event.currentTarget as HTMLInputElement).value }),
      onKeyDown,
      onBlur: () => send({ type: 'COMMIT_TEXT' }),
    }),
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      'aria-label': options.choose ?? (range ? 'Choose dates' : 'Choose date'),
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'data-state': state.open ? 'open' : 'closed',
      onClick: () => send({ type: 'TOGGLE' }),
    }),
    triggerIconProps: normalize({ ...anatomy.attrs('trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'calendar' satisfies IconName }),
    positionerProps: normalize({ ...anatomy.attrs('positioner'), popover: 'manual', 'data-state': state.open ? 'open' : 'closed' }),
    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': calendar.ids.title,
      'data-state': state.open ? 'open' : 'closed',
    }),
    /** The presets, each with the range it stands for today. */
    presets: (options.presets ?? []).map((preset) => ({ preset, range: typeof preset.value === 'function' ? preset.value(state.calendar.today) : preset.value })),
    presetsProps: normalize({ ...anatomy.attrs('presets'), role: 'group', 'aria-label': options.presetsLabel ?? 'Presets' }),
    getPresetProps: (preset: DatePreset) => {
      const chosen = typeof preset.value === 'function' ? preset.value(state.calendar.today) : preset.value
      const refused = !chosen.start || [chosen.start, chosen.end].some((date) => date !== null && isUnavailable(state.calendar, date))
      const current = chosen.start === value.start && (chosen.end ?? null) === (value.end ?? null)
      return normalize({
        ...anatomy.attrs('preset'),
        type: 'button',
        'aria-pressed': current ? 'true' : 'false',
        disabled: refused || undefined,
        'data-current': current ? '' : undefined,
        onClick: () => {
          send({ type: 'CALENDAR', event: { type: 'SET', value: range ? chosen : { start: chosen.start, end: null } } })
          // The same range again is no change, and still the end of the visit.
          send({ type: 'CLOSE' })
        },
      })
    },
    errorProps: normalize({ ...anatomy.attrs('error'), id: ids.error }),
    hiddenInputProps: normalize({ type: 'hidden', name: options.name, form: options.form, value: submitted }),
    close: () => send({ type: 'CLOSE' }),
    clear: () => send({ type: 'CALENDAR', event: { type: 'CLEAR' } }),
    setValue: (next: DateRange) => send({ type: 'SYNC_VALUE', value: next }),
  }
}

export type DatePickerApi<T = Dict> = ReturnType<typeof connect<T>>
