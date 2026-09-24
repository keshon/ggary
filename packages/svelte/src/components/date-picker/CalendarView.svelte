<script lang="ts">
  import type { CalendarApi } from '@ggary/core/calendar'
  import type { Dict } from '@ggary/core'

  /** The month and its grid: shared by Calendar and DatePicker. */
  let { api, grid = $bindable() }: { api: CalendarApi<Dict>; grid?: HTMLTableElement } = $props()
</script>

<div {...api.rootProps}>
  <div {...api.headerProps}>
    <button {...api.prevProps}><span {...api.prevIconProps}></span></button>
    <div {...api.titleProps}>{api.title}</div>
    <button {...api.nextProps}><span {...api.nextIconProps}></span></button>
  </div>
  <table bind:this={grid} {...api.gridProps}>
    <thead {...api.headProps}>
      <tr {...api.headRowProps}>
        {#each api.weekdays as day, index (day.long)}<th {...api.getWeekdayProps(index)}>{day.short}</th>{/each}
      </tr>
    </thead>
    <tbody {...api.bodyProps}>
      {#each api.weeks as week (week[0])}
        <tr {...api.weekProps}>
          {#each week as date (date)}<td {...api.getDayProps(date)}>{api.dayText(date)}</td>{/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
