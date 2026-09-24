<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, createCalendarMachine, focusCalendarDay, toRange, type CalendarMode, type CalendarWords, type DateRange } from '@ggary/core/calendar'
  import { svelteNormalizer, uid, type ISODate } from '@ggary/core'
  import { untrack } from 'svelte'
  import CalendarView from './CalendarView.svelte'

  type Props = {
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
    defaultMonth?: ISODate
    words?: CalendarWords
  }

  /** A month to choose a day, or a range, from — on the page itself. */
  let { value = $bindable(), defaultValue, onValueChange, mode, min, max, weekStart, isDateDisabled, months, locale: ownLocale, defaultMonth, words: ownWords }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'calendar', ownWords))

  const machine = untrack(() =>
    createCalendarMachine({
      id: uid('gg-calendar'),
      defaultValue: value !== undefined ? value : defaultValue,
      mode, min, max, weekStart, isDateDisabled, months, locale, defaultMonth,
      onValueChange: (next) => {
        value = mode === 'range' ? next : next.start
        onValueChange?.(next)
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, { ...words, locale }))

  $effect(() => machine.send({ type: 'SYNC_OPTIONS', mode, min, max, weekStart, isDateDisabled, months }))
  $effect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value: toRange(value) })
  })

  let grid = $state<HTMLDivElement>()
  $effect(() => {
    const id = api.focusedId
    untrack(() => focusCalendarDay(grid ?? null, id))
  })
</script>

<CalendarView {api} bind:grid />
