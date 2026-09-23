import type { Dict, Normalizer } from '../../types'
import { liveAttrs } from '../../utils/region'
import { connectDot } from '../states/states.connect'
import { queueAnatomy, taskAnatomy } from './task.anatomy'
import { TASK_TONES, type QueueEvent, type QueueState, type QueueWords, type QueueWordsInput, type TaskItem } from './task.types'

export const QUEUE_WORDS: QueueWords = {
  state: {
    queued: 'queued',
    running: 'running',
    done: 'done',
    warn: 'done with a remark',
    failed: 'failed',
    skipped: 'skipped',
  },
  row: (title, state, detail, meta) => [title, state, detail, meta].filter(Boolean).join(', '),
  changed: (title, state) => `${title}: ${state}`,
}

/** A value as an id fragment: any character outside [A-Za-z0-9_-] is spelled out. */
const idPart = (value: string) => value.replace(/[^\w-]/g, (char) => `_${char.charCodeAt(0).toString(16)}`)

export const queueIds = (id: string) => ({
  root: id,
  status: `${id}-status`,
  task: (value: string) => `${id}-task-${idPart(value)}`,
})

/** The dot's own props, before this component's normalizer sees them. */
const same = (props: Dict) => props

export interface QueueConnectOptions {
  /** The queue's accessible name. Without it a listbox is an unnamed list of options. */
  label?: string
  words?: QueueWordsInput
}

/**
 * The queue of an agent's tasks: hundreds of FLAT rows, each with a phase, a
 * name and perhaps a time.
 *
 * Flat is the whole design. A row with a body — a step's input and output, a
 * log — is a different component: at a hundred rows a border around each turns
 * the queue into a grid, and a queue is read by running the eye down the
 * gutter of dots, which only works while the rows are the same height and
 * nothing between them interrupts. There is nothing to expand here.
 *
 * Nor is it a data grid row. A grid compares RECORDS BY FIELD: it has columns
 * with headers, and its value is that the third field of row nine can be read
 * against the third field of row two. A queue has no columns — the title, the
 * detail and the time are one thing said at three sizes — and nothing in it
 * is compared field by field. Its roles say the same: a grid is a `grid` of
 * `gridcell`s, navigated in two dimensions; a queue is a `listbox` of
 * `option`s, navigated in one, because what a queue is FOR is choosing a task
 * to look at. The keyboard follows from that: one tab stop for the whole
 * list, the arrows inside it, and the selection follows the focus.
 *
 * The phase is `data-state`, which has six values where the kit's tones have
 * five; its COLOUR comes through a tone all the same, so a row, a badge and a
 * dot never disagree. A state paints the row and is not spoken, so it is in
 * the row's name in words as well, and a phase that turns over while the
 * queue is watched is said once in a polite live region.
 */
export function connect<T = Dict>(
  state: QueueState,
  send: (event: QueueEvent) => void,
  normalize: Normalizer<T>,
  options: QueueConnectOptions = {}
) {
  const ids = queueIds(state.id)
  const w = { ...QUEUE_WORDS, ...options.words, state: { ...QUEUE_WORDS.state, ...options.words?.state } }
  // The tab stop: the focused row, or the chosen one, or the first that exists.
  const stop = state.focus.value ?? state.value ?? state.tasks.find((task) => !task.disabled)?.value ?? null

  const changedTask = state.changed.nonce > 0 ? state.tasks.find((task) => task.value === state.changed.value) : undefined
  const announcement = changedTask ? w.changed(changedTask.title, w.state[state.changed.state]) : null

  const onKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        send({ type: 'MOVE', step: 1 })
        return
      case 'ArrowUp':
        event.preventDefault()
        send({ type: 'MOVE', step: -1 })
        return
      case 'Home':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'first' })
        return
      case 'End':
        event.preventDefault()
        send({ type: 'EDGE', edge: 'last' })
        return
    }
  }

  return {
    ids,
    value: state.value,
    tasks: state.tasks,
    /** Watch this: when it changes, move real focus to the row with `focusValue`. 0 means never. */
    focusNonce: state.focus.nonce,
    focusValue: state.focus.value,
    /** What changed, in words. Null while nothing has. */
    announcement,

    select: (value: string) => send({ type: 'SELECT', value }),

    rootProps: normalize({
      ...queueAnatomy.attrs('root'),
      id: ids.root,
      role: 'listbox',
      'aria-label': options.label,
    }),

    /**
     * The live region stands OUTSIDE the listbox: a node appearing among the
     * options would be an option with no role, and the reading of the list
     * would count it.
     */
    statusProps: normalize({ ...queueAnatomy.attrs('status'), id: ids.status, ...liveAttrs('polite') }),

    getTaskProps: (task: TaskItem) => {
      const phase = task.state ?? 'queued'
      const selected = task.value === state.value
      return normalize({
        ...taskAnatomy.attrs('root'),
        id: ids.task(task.value),
        role: 'option',
        'aria-selected': selected ? 'true' : 'false',
        'aria-disabled': task.disabled ? 'true' : undefined,
        // The row's own text is the title, the detail and the time; the phase
        // is a colour, so the name says it too.
        'aria-label': w.row(task.title, w.state[phase], task.detail, task.meta),
        // One tab stop for the whole queue; the arrows take over inside it.
        tabIndex: task.value === stop ? 0 : -1,
        'data-value': task.value,
        'data-state': phase,
        'data-tone': TASK_TONES[phase],
        'data-selected': selected ? '' : undefined,
        'data-disabled': task.disabled ? '' : undefined,
        onClick: () => {
          if (!task.disabled) send({ type: 'SELECT', value: task.value })
        },
        onFocusIn: () => send({ type: 'FOCUS', value: task.value }),
        onKeyDown,
      })
    },

    /** A fixed column, so the dots of every row stand on one vertical. */
    getGutterProps: () => normalize({ ...taskAnatomy.attrs('gutter'), 'aria-hidden': 'true' }),
    /** The mark of the phase: the kit's own dot, reading the tone off the row. */
    getDotProps: () => normalize({ ...connectDot({}, same).rootProps }),
    getMainProps: () => normalize({ ...taskAnatomy.attrs('main') }),
    // Cut visually and kept whole in the DOM; the title is for the mouse.
    getTitleProps: (task: TaskItem) => normalize({ ...taskAnatomy.attrs('title'), title: task.title }),
    getSubProps: () => normalize({ ...taskAnatomy.attrs('sub') }),
    getMetaProps: () => normalize({ ...taskAnatomy.attrs('meta') }),
  }
}

export type QueueApi<T = Dict> = ReturnType<typeof connect<T>>
