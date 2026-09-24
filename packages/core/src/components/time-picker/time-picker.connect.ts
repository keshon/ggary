import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { formatTime, nowTime, type ISOTime } from '../../utils/time'
import { timePickerAnatomy } from './time-picker.anatomy'
import { isUnavailable, timesOf } from './time-picker.machine'
import type { TimePickerConnectOptions, TimePickerEvent, TimePickerState } from './time-picker.types'

export const timePickerIds = (id: string) => ({
  root: id,
  label: `${id}-label`,
  input: `${id}-input`,
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  error: `${id}-error`,
  item: (time: ISOTime) => `${id}-time-${time.replace(':', '')}`,
})

/** A time written in the locale's clock: "2:30 PM", "14:30". */
export const exampleTime = (locale?: string) => formatTime('14:30', locale)

export function connect<T = Dict>(state: TimePickerState, send: (event: TimePickerEvent) => void, normalize: Normalizer<T>, options: TimePickerConnectOptions = {}) {
  const ids = timePickerIds(state.id)
  const anatomy = timePickerAnatomy
  const locale = options.locale ?? state.locale
  const shown = state.editing ? state.text : state.value ? formatTime(state.value, locale) : ''
  const times = timesOf(state)
  const example = exampleTime(locale)

  const onKeyDown = (event: KeyboardEvent) => {
    const move = (by: 'next' | 'previous' | 'first' | 'last' | 'page-down' | 'page-up') => {
      event.preventDefault()
      send({ type: 'MOVE', by, now: nowTime() })
    }
    switch (event.key) {
      case 'ArrowDown':
        return move('next')
      case 'ArrowUp':
        return move('previous')
      case 'PageDown':
        return state.open ? move('page-down') : undefined
      case 'PageUp':
        return state.open ? move('page-up') : undefined
      case 'Home':
        return state.open && !state.editing ? move('first') : undefined
      case 'End':
        return state.open && !state.editing ? move('last') : undefined
      case 'Enter':
        if (state.editing) {
          // A typed time is committed, not the form submitted.
          event.preventDefault()
          send({ type: 'COMMIT_TEXT' })
        } else if (state.open && state.highlighted) {
          event.preventDefault()
          send({ type: 'CHOOSE', time: state.highlighted })
        }
        return
      case 'Escape':
        if (state.open) {
          event.preventDefault()
          send({ type: 'CLOSE' })
        } else if (state.editing) {
          event.preventDefault()
          send({ type: 'INPUT', text: state.value ? formatTime(state.value, locale) : '' })
          send({ type: 'COMMIT_TEXT' })
        }
        return
    }
  }

  return {
    ids,
    open: state.open,
    value: state.value,
    invalid: state.invalid,
    highlighted: state.highlighted,
    /** Each time in the list, with its words and whether it may be chosen. */
    times: times.map((time) => ({ time, label: formatTime(time, locale), disabled: isUnavailable(state, time) })),
    errorText: state.invalid ? (options.invalid ?? ((sample: string) => `Enter a time like ${sample}`))(example) : '',

    rootProps: normalize({
      ...anatomy.attrs('root'),
      id: ids.root,
      'data-size': options.size ?? 'md',
      'data-state': state.open ? 'open' : 'closed',
      'data-invalid': state.invalid ? '' : undefined,
      'data-embedded': options.embedded ? '' : undefined,
    }),
    labelProps: normalize({ ...anatomy.attrs('label'), id: ids.label, htmlFor: ids.input }),
    controlProps: normalize({ ...anatomy.attrs('control'), 'data-state': state.open ? 'open' : 'closed', 'data-invalid': state.invalid ? '' : undefined }),
    inputProps: normalize({
      ...anatomy.attrs('input'),
      id: ids.input,
      type: 'text',
      role: 'combobox',
      inputMode: 'text',
      autoComplete: 'off',
      spellCheck: false,
      placeholder: options.placeholder ?? example,
      value: shown,
      'aria-label': options.embedded ? (options.label ?? 'Time') : undefined,
      'aria-autocomplete': 'none',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      'aria-activedescendant': state.open && state.highlighted ? ids.item(state.highlighted) : undefined,
      'aria-invalid': state.invalid ? 'true' : undefined,
      'aria-describedby': state.invalid ? ids.error : undefined,
      onInput: (event: Event) => send({ type: 'INPUT', text: (event.currentTarget as HTMLInputElement).value }),
      onKeyDown,
      onBlur: () => send({ type: 'COMMIT_TEXT' }),
    }),
    /** A pointer's way to the list. Out of the tab order: the field's arrows are the keyboard's. */
    triggerProps: normalize({
      ...anatomy.attrs('trigger'),
      id: ids.trigger,
      type: 'button',
      tabIndex: -1,
      'aria-label': options.choose ?? 'Choose time',
      'aria-controls': ids.content,
      'aria-expanded': state.open ? 'true' : 'false',
      'data-state': state.open ? 'open' : 'closed',
      // Keep the focus in the field: a press on the button must not blur and commit it.
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => send({ type: 'TOGGLE', now: nowTime() }),
    }),
    triggerIconProps: normalize({ ...anatomy.attrs('trigger-icon'), 'aria-hidden': 'true', 'data-icon': 'chevron-down' satisfies IconName }),
    positionerProps: normalize({ ...anatomy.attrs('positioner'), popover: 'manual', 'data-state': state.open ? 'open' : 'closed' }),
    contentProps: normalize({
      ...anatomy.attrs('content'),
      id: ids.content,
      role: 'listbox',
      'aria-label': options.times ?? 'Times',
      tabIndex: -1,
      'data-state': state.open ? 'open' : 'closed',
    }),
    getItemProps: (time: ISOTime) => {
      const disabled = isUnavailable(state, time)
      const chosen = time === state.value
      return normalize({
        ...anatomy.attrs('item'),
        id: ids.item(time),
        role: 'option',
        'aria-selected': chosen ? 'true' : 'false',
        'aria-disabled': disabled ? 'true' : undefined,
        'data-highlighted': time === state.highlighted ? '' : undefined,
        'data-selected': chosen ? '' : undefined,
        'data-disabled': disabled ? '' : undefined,
        // The field keeps the focus while the pointer chooses.
        onMouseDown: (event: MouseEvent) => event.preventDefault(),
        onPointerMove: () => (disabled ? undefined : send({ type: 'HIGHLIGHT', time })),
        onClick: () => (disabled ? undefined : send({ type: 'CHOOSE', time })),
      })
    },
    errorProps: normalize({ ...anatomy.attrs('error'), id: ids.error }),
    hiddenInputProps: normalize({ type: 'hidden', name: options.name, form: options.form, value: state.value ?? '' }),
    close: () => send({ type: 'CLOSE' }),
    clear: () => send({ type: 'CLEAR' }),
  }
}

export type TimePickerApi<T = Dict> = ReturnType<typeof connect<T>>
