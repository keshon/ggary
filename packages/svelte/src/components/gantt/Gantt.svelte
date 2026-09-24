<script lang="ts" generics="T extends GanttTask">
  import { attachGanttDrag, connect, createGanttMachine, focusGanttTask, revealGanttDay, type GanttChange, type GanttGroup, type GanttRange, type GanttScale, type GanttTask, type GanttWords } from '@ggary/core/gantt'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'

  type Props = {
    tasks: T[]
    /** Bindable: the scale shown. Default 'day'. */
    scale?: GanttScale
    defaultScale?: GanttScale
    onScaleChange?: (scale: GanttScale) => void
    /** The days shown. Default: the tasks' own, with room around them. */
    range?: GanttRange | null
    locale?: string
    /** Enter on a task, or a double press on its row. */
    onOpen?: (task: T) => void
    /** A task was moved or resized: it stands at its new dates at once; a rejection puts it back. Without it, bars stay put. */
    onTaskChange?: (change: GanttChange<T>) => Promise<unknown> | unknown
    /** Headings to list tasks under; a task names its own in `group`. */
    groups?: GanttGroup[]
    /** Bindable: the ids of the closed groups. */
    collapsed?: string[]
    defaultCollapsed?: string[]
    onCollapsedChange?: (collapsed: string[]) => void
    /** What the list shows for a task. Default: its title. */
    title?: Snippet<[T]>
    words?: Partial<GanttWords>
  }

  const NO_GROUPS: GanttGroup[] = []

  /** Tasks as bars on a time scale, their names beside them, under headings when there are groups. */
  let { tasks, scale = $bindable(), defaultScale, onScaleChange, range, locale, onOpen, onTaskChange, groups, collapsed = $bindable(), defaultCollapsed, onCollapsedChange, title, words }: Props = $props()

  const machine = untrack(() =>
    createGanttMachine<T>({
      id: uid('gg-gantt'),
      tasks,
      defaultScale: scale ?? defaultScale,
      range,
      locale,
      onScaleChange: (next) => {
        scale = next
        onScaleChange?.(next)
      },
      onOpen: (task) => onOpen?.(task),
      editable: onTaskChange !== undefined,
      onTaskChange: (change) => onTaskChange?.(change),
      groups,
      defaultCollapsed: collapsed ?? defaultCollapsed,
      onCollapsedChange: (next) => {
        collapsed = next
        onCollapsedChange?.(next)
      },
    })
  )
  let snapshot = $state.raw(machine.getState())
  $effect(() => machine.subscribe((next) => (snapshot = next)))
  const api = $derived(connect(snapshot, machine.send, svelteNormalizer, words))
  const shownScale = $derived(snapshot.scale)

  $effect(() => machine.send({ type: 'SYNC_TASKS', tasks }))
  $effect(() => machine.send({ type: 'SYNC_GROUPS', groups: groups ?? NO_GROUPS }))
  $effect(() => {
    if (collapsed !== undefined) machine.send({ type: 'SYNC_COLLAPSED', collapsed })
  })
  $effect(() => {
    if (scale !== undefined) machine.send({ type: 'SYNC_SCALE', scale })
  })
  $effect(() => machine.send({ type: 'SYNC_OPTIONS', range: range ?? null, locale, editable: onTaskChange !== undefined }))

  let lastFocus = 0
  $effect(() => {
    const { focusNonce, focusTask } = api
    if (focusNonce === 0 || focusNonce === lastFocus || !focusTask) return
    lastFocus = focusNonce
    untrack(() => focusGanttTask(document, api.ids.schedule(focusTask)))
  })

  // Opened, and at each new scale, on today — or on the first task when today is not in the chart.
  let rootEl = $state<HTMLDivElement | null>(null)
  $effect(() => {
    if (!rootEl) return
    const root = rootEl
    return untrack(() => attachGanttDrag(root, machine.send))
  })
  $effect(() => {
    void shownScale
    const root = rootEl
    untrack(() => revealGanttDay(root))
  })
</script>

<div bind:this={rootEl} {...api.rootProps}>
  <div {...api.headerProps}>
    <div {...api.cornerProps}>{api.words.task}</div>
    <div {...api.scaleProps}>
      <div {...api.getScaleRowProps('top')}>
        {#each api.top as cell (cell.start)}<div {...api.getScaleCellProps(cell)}><span>{cell.label}</span></div>{/each}
      </div>
      <div {...api.getScaleRowProps('bottom')}>
        {#each api.bottom as cell (cell.start)}<div {...api.getScaleCellProps(cell)}><span>{cell.label}</span></div>{/each}
      </div>
    </div>
  </div>
  <div {...api.bodyProps}>
    {#if api.links.length > 0}
      <div {...api.linksProps}>
        {#each api.links as link (`${link.from}>${link.to}`)}
          <div {...api.getLinkProps(link)}>
            {#each api.segmentsOf(link) as segment, index (index)}<span {...api.getSegmentProps(segment)}></span>{/each}
            <span {...api.getHeadProps(link)}></span>
          </div>
        {/each}
      </div>
    {/if}
    {#if api.todayInRange}<div {...api.todayProps}></div>{/if}
    {#each api.rows as row (row.kind === 'group' ? `group:${row.id}` : row.id)}
      {#if row.kind === 'group'}
        {@const summary = api.getSummaryProps(row.group)}
        <div {...api.getGroupRowProps(row.group)}>
          <div {...api.getGroupTitleProps(row.group)}><span {...api.getGroupToggleProps(row.group)}></span><span>{row.group.title}</span></div>
          <div {...api.getGroupScheduleProps(row.group)}>
            <span {...api.scheduleTextProps}>{api.describeGroup(row.group)}</span>
            {#if summary}<div {...summary}><div {...api.getSummaryProgressProps(row.group)}></div></div>{/if}
          </div>
        </div>
      {:else}
        {@const task = row.task}
        <div {...api.getRowProps(task)}>
          <div {...api.getTitleProps(task)}>{#if title}{@render title(task)}{:else}{task.title}{/if}</div>
          <div {...api.getScheduleProps(task)}>
            <span {...api.scheduleTextProps}>{api.describe(task)}</span>
            <div {...api.getBarProps(task)}>
              {#if !task.milestone}<div {...api.getBarProgressProps(task)}></div>{/if}
              <span {...api.barLabelProps}>{task.title}</span>
              {#if api.showGrips(task)}<span {...api.getGripProps('start')}></span><span {...api.getGripProps('end')}></span>{/if}
            </div>
          </div>
        </div>
      {/if}
    {/each}
    {#if api.rows.length === 0}<div {...api.emptyProps}>{api.words.empty}</div>{/if}
  </div>
  <div {...api.liveProps}>{api.announcement}</div>
  {#if api.editable}<div {...api.instructionsProps}>{api.words.instructions}</div>{/if}
</div>
