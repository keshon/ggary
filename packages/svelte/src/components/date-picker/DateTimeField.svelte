<script lang="ts">
  import type { ControlSize } from '@ggary/core'
  import type { DatePickerWords } from '@ggary/core/date-picker'
  import type { TimePickerWords } from '@ggary/core/time-picker'
  import { joinDateTime, splitDateTime, type ISODate, type ISODateTime, type ISOTime } from '@ggary/core'
  import { untrack } from 'svelte'
  import DateField from './DateField.svelte'
  import TimePicker from '../time-picker/TimePicker.svelte'

  type Props = {
    size?: ControlSize
    label?: string
    /** Bindable: `YYYY-MM-DDTHH:mm`, a wall-clock day and time with no zone. */
    value?: ISODateTime | null
    defaultValue?: ISODateTime | null
    /** The day and the time together once both are set; null while either is missing. */
    onValueChange?: (value: ISODateTime | null) => void
    min?: ISODate | null
    max?: ISODate | null
    weekStart?: number
    isDateDisabled?: (date: ISODate) => boolean
    /** How many months stand side by side: 1, or 2 for a range across a month's end. Default 1. */
    months?: 1 | 2
    locale?: string
    name?: string
    placeholder?: string
    words?: DatePickerWords
    /** Minutes between the times in the list. Default 15. */
    step?: number
    /** The time field's name for a screen reader. Default "Time". */
    timeLabel?: string
    timeWords?: TimePickerWords
  }

  /**
   * The day's field and the time's, in one box. Each keeps its own state and
   * reports its half; this joins them, and submits the pair as one value.
   */
  let {
    size, label, value = $bindable(), defaultValue, onValueChange, min, max, weekStart, isDateDisabled, months, locale, name, placeholder, words,
    step, timeLabel = 'Time', timeWords,
  }: Props = $props()

  const initial = untrack(() => splitDateTime(value !== undefined ? value : defaultValue))
  let own = $state(initial)
  const parts = $derived(value !== undefined ? splitDateTime(value) : own)

  function update(patch: { date?: ISODate | null; time?: ISOTime | null }) {
    const next = { ...parts, ...patch }
    own = next
    const joined = joinDateTime(next.date, next.time)
    // A bound value follows only a whole date-time; a half-set one leaves it null.
    if (value !== undefined || joined !== null) value = joined
    onValueChange?.(joined)
  }
</script>

{#snippet time()}
  <TimePicker embedded label={timeLabel} {size} {locale} {step} value={parts.time} onValueChange={(next) => update({ time: next })} words={timeWords} />
{/snippet}

<DateField
  {size} {label} {min} {max} {weekStart} {isDateDisabled} {months} {locale} {name} {placeholder} {words}
  mode="single"
  value={parts.date}
  onValueChange={(range) => update({ date: range.start })}
  submitAs={joinDateTime(parts.date, parts.time) ?? ''}
  onReset={() => (own = initial)}
  timeSlot={time}
/>
