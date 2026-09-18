import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createGanttMachine, focusGanttTask, revealGanttDay, type GanttRange, type GanttScale, type GanttTask, type GanttWords } from '@ggary/core/gantt'
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
  /** What the list shows for a task. Default: its title. */
  children?: (task: T) => ReactNode
  words?: Partial<GanttWords>
}

/** Tasks as bars on a time scale, their names beside them. */
export function Gantt<T extends GanttTask>(props: GanttProps<T>) {
  const { tasks, scale, defaultScale, onScaleChange, range, locale, onOpen, children, words } = props
  const id = `gg-gantt-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onScaleChange, onOpen })
  callbacks.current = { onScaleChange, onOpen }
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
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, words)

  useEffect(() => machine.send({ type: 'SYNC_TASKS', tasks }), [machine, tasks])
  useEffect(() => {
    if (scale !== undefined) machine.send({ type: 'SYNC_SCALE', scale })
  }, [machine, scale])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', range: range ?? null, locale }), [machine, range, locale])

  const lastFocus = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocus.current || !api.focusTask) return
    lastFocus.current = api.focusNonce
    focusGanttTask(document, api.ids.schedule(api.focusTask))
  })

  // Opened, and at each new scale, on today — or on the first task when today is not in the chart.
  const rootRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => revealGanttDay(rootRef.current), [state.scale])

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
        {api.todayInRange && <div {...api.todayProps} />}
        {api.tasks.map((task, index) => (
          <div key={task.id} {...api.getRowProps(task, index)}>
            <div {...api.getTitleProps(task)}>{children ? children(task) : task.title}</div>
            <div {...api.getScheduleProps(task)}>
              <span {...api.scheduleTextProps}>{api.describe(task)}</span>
              <div {...api.getBarProps(task)}>
                {!task.milestone && <div {...api.getBarProgressProps(task)} />}
                <span {...api.barLabelProps}>{task.title}</span>
              </div>
            </div>
          </div>
        ))}
        {api.tasks.length === 0 && <div {...api.emptyProps}>{api.words.empty}</div>}
      </div>
    </div>
  )
}
