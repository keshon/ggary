<script lang="ts">
 import { Calendar as Single, RangeCalendar as Range } from 'bits-ui'
 import { parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date'
 import { getConfig } from '../config-provider/context'
 import { configWords } from '@ggary/core/config-provider'
 import { toRange, type CalendarMode, type CalendarWords, type DateRange } from '@ggary/core/calendar'
 import { weekStartOf, type ISODate } from '@ggary/core'
 import { untrack } from 'svelte'
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


 const id = $props.id()
 const part = (name: string) => ({ 'data-scope': 'calendar', 'data-part': name, 'data-backend': 'bits-ui' })
 untrack(() => { if (value === undefined) value = defaultValue ?? null })
 const chosen = $derived(toRange(value ?? null))
 const date = (iso: ISODate | null | undefined) => iso ? parseDate(iso) : undefined
 const singleValue = $derived(date(chosen.start))
 let rangeValue = $state<{ start: DateValue | undefined; end: DateValue | undefined }>(untrack(() => ({ start: date(chosen.start), end: date(chosen.end) })))
 let externalRange = untrack(() => ({ ...chosen }))
 $effect(() => {
  if (chosen.start === externalRange.start && chosen.end === externalRange.end) return
  externalRange = { ...chosen }
  rangeValue = { start: date(chosen.start), end: date(chosen.end) }
 })
 let placeholder = $state<DateValue>(untrack(() => date(chosen.start ?? defaultMonth) ?? today(getLocalTimeZone())))
 const options = $derived({ locale: locale ?? 'en-US', dir: kit().dir ?? 'ltr', numberOfMonths: months ?? 1, weekStartsOn: (weekStart ?? weekStartOf(locale)) as 0|1|2|3|4|5|6, fixedWeeks: true, weekdayFormat: 'short' as const, disableDaysOutsideMonth: (months ?? 1) > 1, minValue: date(min), maxValue: date(max), isDateDisabled: (day: DateValue) => isDateDisabled?.(day.toString() as ISODate) ?? false, preventDeselect: true })
 const Parts = $derived(mode === 'range' ? Range : Single)
 function changed(next: DateRange) {
  if (next.start === chosen.start && next.end === chosen.end) return
  value = mode === 'range' ? next : next.start
  onValueChange?.(next)
 }
 const monthTitle = (day: DateValue) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day.toString()}T12:00:00Z`))
</script>

{#snippet contents(pages: {value: DateValue; weeks: DateValue[][]}[], weekdays: string[])}
 <div {...part('months')} data-count={months ?? 1}>
  {#each pages as page, index (index)}
   <div {...part('month')} data-page={index}>
    <Parts.Header {...part('header')}>
     {#if index === 0}<Parts.PrevButton>{#snippet child({ props: navProps })}<button {...navProps} {...part('prev')} disabled={navProps['aria-disabled'] === 'true' || navProps['aria-disabled'] === true} aria-label={words?.previousMonth ?? 'Previous month'}><span {...part('nav-icon')} data-direction="prev" data-icon="chevron-right" aria-hidden="true"></span></button>{/snippet}</Parts.PrevButton>{/if}
     <Parts.Heading {...part('title')} id={`${id}-title-${index}`}>{monthTitle(page.value)}</Parts.Heading>
     {#if index === pages.length-1}<Parts.NextButton>{#snippet child({ props: navProps })}<button {...navProps} {...part('next')} disabled={navProps['aria-disabled'] === 'true' || navProps['aria-disabled'] === true} aria-label={words?.nextMonth ?? 'Next month'}><span {...part('nav-icon')} data-direction="next" data-icon="chevron-right" aria-hidden="true"></span></button>{/snippet}</Parts.NextButton>{/if}
    </Parts.Header>
    <Parts.Grid>
     {#snippet child({ props: gridProps })}
     <table {...gridProps} {...part('grid')} role="grid" aria-labelledby={`${id}-title-${index}`} aria-multiselectable={mode === 'range' ? 'true' : undefined}>
     <Parts.GridHead {...part('head')}><Parts.GridRow {...part('head-row')}>{#each weekdays as day, weekday}<Parts.HeadCell {...part('weekday')} role="columnheader" aria-label={new Intl.DateTimeFormat(locale, {weekday: 'long', timeZone: 'UTC'}).format(new Date(`${page.weeks[0][weekday].toString()}T12:00:00Z`))}>{day}</Parts.HeadCell>{/each}</Parts.GridRow></Parts.GridHead>
     <Parts.GridBody {...part('body')}>
      {#each page.weeks as week}
       <Parts.GridRow {...part('week')}>
        {#each week as day (day.toString())}
         <Parts.Cell date={day} month={page.value} {...part('cell')}>
          <Parts.Day {...part('day')} data-date={day.toString()}>
           {#snippet child({ props: dayProps })}
            <div {...dayProps} {...part('day')} data-date={(months ?? 1) > 1 && day.month !== page.value.month ? undefined : day.toString()} aria-hidden={(months ?? 1) > 1 && day.month !== page.value.month ? 'true' : undefined} data-selected={mode === 'range' ? (dayProps['data-range-start'] !== undefined || dayProps['data-range-end'] !== undefined || dayProps['data-selection-start'] !== undefined || dayProps['data-selection-end'] !== undefined ? '' : undefined) : dayProps['data-selected']} data-blank={(months ?? 1) > 1 && day.month !== page.value.month ? '' : undefined} data-outside={day.month !== page.value.month ? '' : undefined} data-in-range={mode === 'range' && (dayProps['data-selected'] !== undefined || dayProps['data-highlighted'] !== undefined) ? '' : undefined} data-range-start={dayProps['data-range-start'] ?? dayProps['data-selection-start']} data-range-end={dayProps['data-range-end'] ?? dayProps['data-selection-end']}>{(months ?? 1) > 1 && day.month !== page.value.month ? '' : day.day}</div>
           {/snippet}
          </Parts.Day>
         </Parts.Cell>
        {/each}
       </Parts.GridRow>
      {/each}
     </Parts.GridBody>
     </table>
     {/snippet}
    </Parts.Grid>
   </div>
  {/each}
 </div>
{/snippet}

{#if mode === 'range'}
 <Range.Root {...part('root')} data-mode="range" {...options} bind:placeholder bind:value={() => rangeValue, next => { rangeValue = next; if (next.start && next.end) changed({start: next.start.toString() as ISODate, end: next.end.toString() as ISODate}) }}>
  {#snippet children({ months: pages, weekdays })}{@render contents(pages, weekdays)}{/snippet}
 </Range.Root>
{:else}
 <Single.Root type="single" {...part('root')} data-mode="single" {...options} bind:placeholder bind:value={() => singleValue, next => changed({start: next?.toString() as ISODate ?? null, end: null})}>
  {#snippet children({ months: pages, weekdays })}{@render contents(pages, weekdays)}{/snippet}
 </Single.Root>
{/if}
