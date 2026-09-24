import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { connect, createQueueMachine, type QueueWordsInput, type TaskItem } from '@ggary/core/task'
import { reactNormalizer, rovingFocus } from '@ggary/core'
import { useConfigured } from '../config-provider'

export interface QueueProps {
  tasks: TaskItem[]
  /** The queue's accessible name. */
  label?: string
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** The fixed text of a row's name and of the live region. */
  words?: QueueWordsInput
}

/**
 * The queue of an agent's tasks: flat rows, hundreds of them, one tab stop for
 * the list and the arrows inside it. The selection follows the focus, because
 * what a queue is for is choosing the task to look at.
 */
export function Queue(own: QueueProps) {
  const { tasks, label, value, defaultValue, onValueChange, words } = useConfigured(own, { words: 'queue' })
  const id = `gg-queue-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }

  const [machine] = useState(() =>
    createQueueMachine({
      id,
      tasks,
      value,
      defaultValue,
      onValueChange: (next) => callbacks.current.onValueChange?.(next),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, words })

  useEffect(() => machine.send({ type: 'SYNC_TASKS', tasks }), [machine, tasks])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  // Roving focus moves only when the machine asks (the nonce), never on a re-render.
  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusValue === null) return
    lastFocusNonce.current = api.focusNonce
    rovingFocus(document, api.ids.task(api.focusValue))
  })

  return (
    <>
      <div {...api.rootProps}>
        {api.tasks.map((task) => (
          <div key={task.value} {...api.getTaskProps(task)}>
            <span {...api.getGutterProps()}>
              <span {...api.getDotProps()} />
            </span>
            <span {...api.getMainProps()}>
              <span {...api.getTitleProps(task)}>{task.title}</span>
              {task.detail && <span {...api.getSubProps()}>{task.detail}</span>}
            </span>
            {task.meta && <span {...api.getMetaProps()}>{task.meta}</span>}
          </div>
        ))}
      </div>
      <div {...api.statusProps}>{api.announcement}</div>
    </>
  )
}
