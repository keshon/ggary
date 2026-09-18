<script lang="ts">
  import { focusCalendarDay, toRange, type CalendarMode, type DateRange } from '@ggary/core/calendar'
  import { connect, createDatePickerMachine, type DatePickerWords, type DatePreset } from '@ggary/core/date-picker'
  import { attachPopover, mergeProps, onFormReset, svelteNormalizer, uid, type ISODate } from '@ggary/core'
  import { useFormField } from '../form/context.svelte'
  import { untrack } from 'svelte'
  import CalendarView from './CalendarView.svelte'

  type Props = {
    label?: string
    /** Bindable: a day, or `{ start, end }` for a range. */
    value?: ISODate | DateRange | null
    defaultValue?: ISODate | DateRange | null
    onValueChange?: (value: DateRange) => void
    mode?: CalendarMode
    min?: ISODate | null
    max?: ISODate | null
    weekStart?: number
    isDateDisabled?: (date: ISODate) => boolean
    locale?: string
    /** Submits `YYYY-MM-DD`, or `YYYY-MM-DD/YYYY-MM-DD` for a range. */
    name?: string
    placeholder?: string
    /** Choices made in one press beside the calendar. `rangePresets()` gives the usual ones for a range. */
    presets?: DatePreset[]
    words?: DatePickerWords
  }

  /** A field for a day or a range of days, typed or chosen from a calendar. */
  let {
    label, value = $bindable(), defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, locale, name, placeholder, presets, words,
  }: Props = $props()

  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  const machine = untrack(() =>
    createDatePickerMachine({
      id: uid('gg-date'),
      defaultValue: initial,
      mode, min, max, weekStart, isDateDisabled, locale,
      onValueChange: (next) => {
        value = mode === 'range' ? next : next.start
        onValueChange?.(next)
        form.edited()
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  // Effects that attach on open read this, not the snapshot: a new snapshot on every
  // change would detach and attach them again on each key.
  const isOpen = $derived(snapshot.open)
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, presets }))
  // Inside a Form, by name: the error its rules hold for this day.
  const form = useFormField(() => name, () => api.ids.input, () => label)

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', locale, mode, min, max, weekStart, isDateDisabled }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  })

  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  let positionerEl = $state<HTMLDivElement | null>(null)
  let grid = $state<HTMLTableElement>()

  $effect(() =>
    onFormReset(inputEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: toRange(initial) })
    })
  )

  $effect(() => {
    const positioner = positionerEl
    if (!isOpen || !controlEl || !positioner) return
    return untrack(() => {
      const popover = attachPopover(controlEl!, positioner, {
        placement: 'bottom-start',
        gutter: 4,
        sameWidth: false,
        onDismiss: () => machine.send({ type: 'CLOSE' }),
      })
      // The calendar is drawn in this same update: focus its day once it is.
      queueMicrotask(() => document.getElementById(api.calendar.focusedId)?.focus({ preventScroll: true }))
      return () => {
        const active = document.activeElement
        const inside = !active || active === document.body || positioner.contains(active)
        popover.destroy()
        if (inside) inputEl?.focus({ preventScroll: true })
      }
    })
  })

  $effect(() => {
    const id = api.calendar.focusedId
    untrack(() => focusCalendarDay(grid ?? null, id))
  })
</script>

<div {...api.rootProps}>
  {#if label}<label {...api.labelProps}>{label}</label>{/if}
  <div bind:this={controlEl} {...api.controlProps}>
    <input bind:this={inputEl} {...mergeProps(api.inputProps, form.field.controlProps)} />
    <button {...api.triggerProps}><span {...api.triggerIconProps}></span></button>
  </div>
  {#if api.invalid}<span {...api.errorProps}>{api.errorText}</span>{/if}
  <span {...form.field.errorProps}>{form.error}</span>
  <div bind:this={positionerEl} {...api.positionerProps}>
    <div {...api.contentProps}>
      {#if snapshot.open}
        <CalendarView api={api.calendar} bind:grid />
        {#if api.presets.length > 0}
          <div {...api.presetsProps}>
            {#each api.presets as { preset } (preset.label)}<button {...api.getPresetProps(preset)}>{preset.label}</button>{/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
  {#if name}<input {...api.hiddenInputProps} />{/if}
</div>
