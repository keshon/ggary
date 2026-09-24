import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { attachGanttDrag, connect, createGanttMachine, focusGanttTask, revealGanttDay, type GanttChange, type GanttGroup, type GanttRange, type GanttScale, type GanttTask, type GanttWords } from '@ggary/core/gantt'
import { reactNormalizer } from '@ggary/core'

export interface GanttProps<T extends GanttTask> {
  tasks: T[]
  /** Controlled; `defaultScale` for uncontrolled. Default 'day'. */
  scale?: GanttScale
  defaultScale?: GanttScale
  onScaleChange?: (scale: GanttScale) => void
  /** The days shown. Default: the tasks' own, with room around them. */
  range?: GanttRange | null
  locale?: string
  /** Enter on a task, or a double press on its row. */
  onOpen?: (task: T) => void
  /**
   * A task was moved or resized — dragged, or with the arrow keys. It stands
   * at its new dates at once; return a promise to say whether it holds, and
   * apply it to `tasks` when it does. Without it, bars stay put.
   */
  onTaskChange?: (change: GanttChange<T>) => Promise<unknown> | unknown
  /** Headings to list tasks under; a task names its own in `group`. */
  groups?: GanttGroup[]
  /** The ids of the closed groups. Controlled; `defaultCollapsed` for uncontrolled. */
  collapsed?: string[]
  defaultCollapsed?: string[]
  onCollapsedChange?: (collapsed: string[]) => void
  /** What the list shows for a task. Default: its title. */
  children?: (task: T) => ReactNode
  words?: Partial<GanttWords>
}

const NO_GROUPS: GanttGroup[] = []

/** Tasks as bars on a time scale, their names beside them, under headings when there are groups. */
export function Gantt<T extends GanttTask>(props: GanttProps<T>) {
  const { tasks, scale, defaultScale, onScaleChange, range, locale, onOpen, onTaskChange, groups, collapsed, defaultCollapsed, onCollapsedChange, children, words } = props
  const id = `gg-gantt-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onScaleChange, onOpen, onTaskChange, onCollapsedChange })
  callbacks.current = { onScaleChange, onOpen, onTaskChange, onCollapsedChange }
  const [machine] = useState(() =>
    createGanttMachine<T>({
      id,
      tasks,
      scale,
      defaultScale,
      range,
      locale,
      onScaleChange: (next) => callbacks.current.onScaleChange?.(next),
      onOpen: (task) => callbacks.current.onOpen?.(task),
      editable: onTaskChange !== undefined,
      onTaskChange: (change) => callbacks.current.onTaskChange?.(change),
      groups,
      collapsed,
      defaultCollapsed,
      onCollapsedChange: (next) => callbacks.current.onCollapsedChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { words })

  useEffect(() => machine.send({ type: 'SYNC_TASKS', tasks }), [machine, tasks])
  useEffect(() => machine.send({ type: 'SYNC_GROUPS', groups: groups ?? NO_GROUPS }), [machine, groups])
  useEffect(() => {
    if (collapsed !== undefined) machine.send({ type: 'SYNC_COLLAPSED', collapsed })
  }, [machine, collapsed])
  useEffect(() => {
    if (scale !== undefined) machine.send({ type: 'SYNC_SCALE', scale })
  }, [machine, scale])
  const editable = onTaskChange !== undefined
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', range: range ?? null, locale, editable }), [machine, range, locale, editable])

  const lastFocus = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocus.current || !api.focusTask) return
    lastFocus.current = api.focusNonce
    focusGanttTask(document, api.ids.schedule(api.focusTask))
  })

  // Opened, and at each new scale, on today — or on the first task when today is not in the chart.
  const rootRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => revealGanttDay(rootRef.current), [state.scale])
  useEffect(() => (rootRef.current ? attachGanttDrag(rootRef.current, machine.send) : undefined), [machine])

  return (
    <div ref={rootRef} {...api.rootProps}>
      <div {...api.headerProps}>
        <div {...api.cornerProps}>{api.words.task}</div>
        <div {...api.scaleProps}>
          <div {...api.getScaleRowProps('top')}>
            {api.top.map((cell) => (
              <div key={cell.start} {...api.getScaleCellProps(cell)}>
                <span>{cell.label}</span>
              </div>
            ))}
          </div>
          <div {...api.getScaleRowProps('bottom')}>
            {api.bottom.map((cell) => (
              <div key={cell.start} {...api.getScaleCellProps(cell)}>
                <span>{cell.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div {...api.bodyProps}>
        {api.links.length > 0 && (
          <div {...api.linksProps}>
            {api.links.map((link) => (
              <div key={`${link.from}>${link.to}`} {...api.getLinkProps(link)}>
                {api.segmentsOf(link).map((segment, index) => (
                  <span key={index} {...api.getSegmentProps(segment)} />
                ))}
                <span {...api.getHeadProps(link)} />
              </div>
            ))}
          </div>
        )}
        {api.todayInRange && <div {...api.todayProps} />}
        {api.rows.map((row) => {
          if (row.kind === 'group') {
            const summary = api.getSummaryProps(row.group)
            return (
              <div key={`group:${row.id}`} {...api.getGroupRowProps(row.group)}>
                <div {...api.getGroupTitleProps(row.group)}>
                  <span {...api.getGroupToggleProps(row.group)} />
                  <span>{row.group.title}</span>
                </div>
                <div {...api.getGroupScheduleProps(row.group)}>
                  <span {...api.scheduleTextProps}>{api.describeGroup(row.group)}</span>
                  {summary && (
                    <div {...summary}>
                      <div {...api.getSummaryProgressProps(row.group)} />
                    </div>
                  )}
                </div>
              </div>
            )
          }
          const task = row.task
          return (
            <div key={task.id} {...api.getRowProps(task)}>
              <div {...api.getTitleProps(task)}>{children ? children(task) : task.title}</div>
              <div {...api.getScheduleProps(task)}>
                <span {...api.scheduleTextProps}>{api.describe(task)}</span>
                <div {...api.getBarProps(task)}>
                  {!task.milestone && <div {...api.getBarProgressProps(task)} />}
                  <span {...api.barLabelProps}>{task.title}</span>
                  {api.showGrips(task) && (
                    <>
                      <span {...api.getGripProps('start')} />
                      <span {...api.getGripProps('end')} />
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {api.rows.length === 0 && <div {...api.emptyProps}>{api.words.empty}</div>}
      </div>
      <div {...api.liveProps}>{api.announcement}</div>
      {api.editable && <div {...api.instructionsProps}>{api.words.instructions}</div>}
    </div>
  )
}
