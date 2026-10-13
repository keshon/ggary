<script lang="ts">
  import { Popover as Primitive, mergeProps as mergePrimitiveProps } from 'bits-ui'
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import type { ControlSize } from '@ggary/core'
  import { toRange, type CalendarMode, type DateRange } from '@ggary/core/calendar'
  import { connect, createDatePickerMachine, type DatePickerWords, type DatePreset } from '@ggary/core/date-picker'
  import { mergeProps, onFormReset, svelteNormalizer, uid, type ISODate } from '@ggary/core'
  import { useFormField } from '../form/context.svelte'
  import { untrack, type Snippet } from 'svelte'
  import Calendar from './Calendar.svelte'

  type Props = {
    /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
    size?: ControlSize
    /** Fill the available inline space. Standalone controls otherwise use the theme's stable field width. */
    fullWidth?: boolean
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
    /** How many months stand side by side: 1, or 2 for a range across a month's end. Default 1. */
    months?: 1 | 2
    locale?: string
    /** Submits `YYYY-MM-DD`, or `YYYY-MM-DD/YYYY-MM-DD` for a range. */
    name?: string
    placeholder?: string
    /** Choices made in one press beside the calendar. `rangePresets()` gives the usual ones for a range. */
    presets?: DatePreset[]
    words?: DatePickerWords
    /** DateTimeField's: the time's field, inside this box, after the calendar's button. */
    timeSlot?: Snippet
    /** DateTimeField's: what the form is sent in place of the day alone. */
    submitAs?: string
    onReset?: () => void
  }

  /** A field for a day or a range of days, typed or chosen from a calendar. DatePicker's, and DateTimeField's day. */
  let {
    size: ownSize,
    label, value = $bindable(), defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, months, locale: ownLocale, name, placeholder, presets, words: ownWords, timeSlot, submitAs, onReset, fullWidth,
  }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const size = $derived(ownSize ?? kit().size)
  const words = $derived(configWords(kit(), 'datePicker', ownWords))

  const initial = untrack(() => (value !== undefined ? value : (defaultValue ?? null)))
  const machine = untrack(() =>
    createDatePickerMachine({
      id: uid('gg-date'),
      defaultValue: initial,
      mode, min, max, weekStart, isDateDisabled, months, locale,
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
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { ...words, locale, name, placeholder: placeholder ?? words?.placeholder, presets, size }))
  // Inside a Form, by name: the error its rules hold for this day.
  const form = useFormField(() => name, () => api.ids.input, () => label)

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', locale, mode, min, max, weekStart, isDateDisabled, months }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  })

  let inputEl = $state<HTMLInputElement | null>(null)
  let controlEl = $state<HTMLDivElement | null>(null)
  let calendarHost = $state<HTMLDivElement | null>(null)

  $effect(() =>
    onFormReset(inputEl, () => {
      value = initial
      machine.send({ type: 'SYNC_VALUE', value: toRange(initial) })
      onReset?.()
    })
  )

  const triggerAttrs = $derived.by(() => {
    const { onclick: _toggle, ...attrs } = api.triggerProps
    return attrs
  })
  let inheritedStyle = $state('')
  let inheritedDir = $state<'ltr' | 'rtl'>('ltr')
  $effect(() => {
    if (!isOpen || !controlEl) return
    const computed = getComputedStyle(controlEl)
    const vars: string[] = []
    for (let i = 0; i < computed.length; i++) { const key = computed[i]; if (key.startsWith('--')) vars.push(`${key}:${computed.getPropertyValue(key)}`) }
    inheritedDir = kit().dir ?? (computed.direction === 'rtl' ? 'rtl' : 'ltr')
    inheritedStyle = `direction:${inheritedDir};${vars.join(';')}`
  })
  function closeAfterDayActivation(event: MouseEvent | KeyboardEvent) {
    if (snapshot.calendar.mode !== 'single') return
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return
    const day = (event.target as Element | null)?.closest('[data-scope=calendar][data-part=day][data-date]')
    if (day && !day.hasAttribute('data-disabled') && day.getAttribute('aria-disabled') !== 'true') machine.send({ type: 'CLOSE' })
  }
  let outside = false
  let wasOpen = false
  $effect(() => {
    if (isOpen) outside = false
    else if (wasOpen && !outside) queueMicrotask(() => {
      if (!snapshot.open && !outside && inputEl?.isConnected) inputEl.focus({ preventScroll: true })
    })
    wasOpen = isOpen
  })
</script>

<Primitive.Root bind:open={() => isOpen, next => { if (next) outside = false; machine.send({ type: next ? 'OPEN' : 'CLOSE' }) }}>
<div {...api.rootProps} data-full-width={fullWidth ? '' : undefined}>
  {#if label}<label {...api.labelProps}>{label}</label>{/if}
  <div bind:this={controlEl} {...api.controlProps}>
    <input bind:this={inputEl} {...mergeProps(api.inputProps, form.field.controlProps)} />
    <Primitive.Trigger {...triggerAttrs}><span {...api.triggerIconProps}></span></Primitive.Trigger>
    {@render timeSlot?.()}
  </div>
  {#if api.invalid}<span {...api.errorProps}>{api.errorText}</span>{/if}
  <span {...form.field.errorProps}>{form.error}</span>
  <Primitive.Portal>
    <Primitive.Content id={api.ids.content} side="bottom" align="start" sideOffset={4} customAnchor={controlEl} strategy="fixed" trapFocus={false} preventScroll={false} dir={inheritedDir} style={inheritedStyle}
      onInteractOutside={() => { outside = true }}
      onOpenAutoFocus={(event) => { event.preventDefault(); calendarHost?.querySelector<HTMLElement>('[data-scope=calendar][data-part=day][tabindex="0"]')?.focus({ preventScroll: true }) }}
      onCloseAutoFocus={(event) => { event.preventDefault(); if (!outside) inputEl?.focus({ preventScroll: true }) }}>
      {#snippet child({ props: contentAttrs, wrapperProps })}
        <div {...wrapperProps} data-scope="date-picker" data-part="positioner" data-backend="bits-ui" data-state="open">
          <div bind:this={calendarHost} {...api.contentProps} {...mergePrimitiveProps(contentAttrs, { onclick: closeAfterDayActivation, onkeydown: closeAfterDayActivation, style: { '--gg-available-width': 'var(--bits-floating-available-width)', '--gg-available-height': 'var(--bits-floating-available-height)' } })} data-scope="date-picker" data-part="content" data-backend="bits-ui" aria-labelledby={undefined} aria-label={words?.choose ?? (mode === 'range' ? 'Choose dates' : 'Choose date')}>
            <Calendar value={snapshot.calendar.value} mode={snapshot.calendar.mode} min={snapshot.calendar.min} max={snapshot.calendar.max}
              weekStart={snapshot.calendar.weekStart} isDateDisabled={snapshot.calendar.isDateDisabled ?? undefined} months={snapshot.calendar.months as 1 | 2} {locale}
              defaultMonth={snapshot.calendar.focused} {words} onValueChange={(next) => {
                machine.send({ type: 'CALENDAR', event: { type: 'SET', value: next } })
                machine.send({ type: 'CLOSE' })
              }} />
            {#if api.presets.length > 0}
              <div {...api.presetsProps}>
                {#each api.presets as { preset } (preset.label)}<button {...api.getPresetProps(preset)}>{preset.label}</button>{/each}
              </div>
            {/if}
          </div>
        </div>
      {/snippet}
    </Primitive.Content>
  </Primitive.Portal>
  {#if name}<input {...mergeProps(api.hiddenInputProps, submitAs !== undefined ? { value: submitAs } : {})} />{/if}
</div>

</Primitive.Root>
