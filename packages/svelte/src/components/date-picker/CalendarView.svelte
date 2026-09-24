<script lang="ts">
  import type { CalendarApi } from '@ggary/core/calendar'
  import type { Dict } from '@ggary/core'

  /** The months and their grids, side by side: shared by Calendar and DatePicker. The first page has the way back, the last the way on. */
  let { api, grid = $bindable() }: { api: CalendarApi<Dict>; grid?: HTMLDivElement } = $props()
</script>

<div {...api.rootProps}>
  <div bind:this={grid} {...api.monthsProps}>
    {#each api.pages as page (page.page)}
      <div {...api.getMonthProps(page.page)}>
        <div {...api.getHeaderProps(page.page)}>
          {#if page.first}<button {...api.prevProps}><span {...api.prevIconProps}></span></button>{/if}
          <div {...api.getTitleProps(page.page)}>{page.title}</div>
          {#if page.last}<button {...api.nextProps}><span {...api.nextIconProps}></span></button>{/if}
        </div>
        <table {...api.getGridProps(page.page)}>
          <thead {...api.headProps}>
            <tr {...api.headRowProps}>
              {#each api.weekdays as day, index (day.long)}<th {...api.getWeekdayProps(index)}>{day.short}</th>{/each}
            </tr>
          </thead>
          <tbody {...api.bodyProps}>
            {#each page.weeks as week (week[0])}
              <tr {...api.weekProps}>
                {#each week as date (date)}<td {...api.getDayProps(date, page.page)}>{api.isBlank(date, page.page) ? '' : api.dayText(date)}</td>{/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  </div>
</div>
