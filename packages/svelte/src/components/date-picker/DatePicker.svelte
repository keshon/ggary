<script lang="ts" generics="Time extends boolean = false">
  import type { ComponentProps } from 'svelte'
  import type { DateRange } from '@ggary/core/calendar'
  import type { ISODate, ISODateTime } from '@ggary/core'
  import DateField from './DateField.svelte'
  import DateTimeField from './DateTimeField.svelte'

  type DayProps = Omit<ComponentProps<typeof DateField>, 'timeSlot' | 'submitAs' | 'onReset' | 'value' | 'defaultValue' | 'onValueChange'>
  type TimeProps = Omit<ComponentProps<typeof DateTimeField>, 'value' | 'defaultValue' | 'onValueChange'>

  /**
   * With `time`, a day and a time in one box, valued `YYYY-MM-DDTHH:mm`; the
   * value and the callback follow it, so a DatePicker without `time` still
   * hands its callback a range.
   */
  type Props = DayProps &
    Partial<Pick<TimeProps, 'step' | 'timeLabel' | 'timeWords'>> & {
      time?: Time
      /** Bindable. A day or `{ start, end }`; with `time`, `YYYY-MM-DDTHH:mm`. */
      value?: Time extends true ? ISODateTime | null : ISODate | DateRange | null
      defaultValue?: Time extends true ? ISODateTime | null : ISODate | DateRange | null
      onValueChange?: (value: Time extends true ? ISODateTime | null : DateRange) => void
    }

  /** A field for a day or a range of days, typed or chosen from a calendar; with `time`, a day and a time. */
  let { time, value = $bindable(), defaultValue, onValueChange, step, timeLabel, timeWords, ...rest }: Props = $props()
</script>

{#if time}
  <DateTimeField
    bind:value={value as ISODateTime | null | undefined}
    defaultValue={defaultValue as ISODateTime | null | undefined}
    onValueChange={onValueChange as ((value: ISODateTime | null) => void) | undefined}
    {step}
    {timeLabel}
    {timeWords}
    {...rest}
  />
{:else}
  <DateField
    bind:value={value as ISODate | DateRange | null | undefined}
    defaultValue={defaultValue as ISODate | DateRange | null | undefined}
    onValueChange={onValueChange as ((value: DateRange) => void) | undefined}
    {...rest}
  />
{/if}
