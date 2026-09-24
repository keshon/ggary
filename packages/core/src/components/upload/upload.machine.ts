import { createMachine, withEffects, type Machine } from '../../machine'
import { acceptsFile } from '../../utils/bytes'
import type { UploadEvent, UploadFunction, UploadItem, UploadOptions, UploadState, UploadedFile } from './upload.types'

export const DEFAULTS: UploadOptions = { accept: null, maxSize: null, maxFiles: null, concurrency: 3, disabled: false }

/** The kit's own refusals: said before anything is sent, and not worth a retry. */
export const isRefused = (item: UploadItem) => item.status === 'error' && item.error !== 'failed'

/** Files that count against `maxFiles`: all but the refused. */
const counted = (items: UploadItem[]) => items.filter((item) => !isRefused(item)).length

function uploaded(id: string, file: UploadedFile): UploadItem {
  return {
    id,
    name: file.name,
    size: file.size ?? null,
    type: '',
    status: 'done',
    progress: 1,
    error: null,
    message: null,
    value: file.value ?? null,
    url: file.url ?? null,
    attempt: 0,
    file: null,
  }
}

/** Starts the waiting files, in the order they came, while there is room. */
function pump(state: UploadState): UploadState {
  let going = state.items.filter((item) => item.status === 'uploading').length
  if (going >= state.concurrency || !state.items.some((item) => item.status === 'waiting')) return state
  const items = state.items.map((item) => {
    if (item.status !== 'waiting' || going >= state.concurrency) return item
    going++
    return { ...item, status: 'uploading' as const, progress: null, attempt: item.attempt + 1 }
  })
  return { ...state, items }
}

const patch = (state: UploadState, id: string, change: (item: UploadItem) => UploadItem | null): UploadState => {
  const items = state.items.flatMap((item) => (item.id === id ? [change(item)].filter((next): next is UploadItem => next !== null) : [item]))
  return { ...state, items }
}

export function reducer(state: UploadState, event: UploadEvent): UploadState {
  switch (event.type) {
    case 'ADD': {
      if (state.disabled || event.files.length === 0) return state
      let items = state.items
      let seq = state.seq
      // One file at most: the first accepted takes the old one's place, as an avatar's does; one refused leaves it.
      const replaces = state.maxFiles === 1
      let replaced = false
      for (const file of event.files) {
        seq++
        const error = !acceptsFile(file, state.accept)
          ? ('wrong-type' as const)
          : state.maxSize !== null && file.size > state.maxSize
            ? ('too-large' as const)
            : replaces
              ? replaced
                ? ('too-many' as const)
                : null
              : state.maxFiles !== null && counted(items) >= state.maxFiles
                ? ('too-many' as const)
                : null
        if (replaces && !error) {
          items = []
          replaced = true
        }
        items = [
          ...items,
          {
            id: `${state.id}-file-${seq}`,
            name: file.name,
            size: file.size,
            type: file.type,
            status: error ? 'error' : 'waiting',
            progress: null,
            error,
            message: null,
            value: null,
            url: null,
            attempt: 0,
            file,
          },
        ]
      }
      return pump({ ...state, items, seq })
    }
    case 'PROGRESS':
      return patch(state, event.id, (item) => {
        if (item.status !== 'uploading' || item.attempt !== event.attempt) return item
        const progress = event.total ? Math.max(0, Math.min(1, event.loaded / event.total)) : null
        return progress === item.progress ? item : { ...item, progress }
      })
    case 'SETTLED': {
      const item = state.items.find((each) => each.id === event.id)
      if (!item || item.status !== 'uploading' || item.attempt !== event.attempt) return state
      const next = patch(state, event.id, (each) =>
        event.ok
          ? { ...each, status: 'done', progress: 1, value: event.value ?? null }
          : { ...each, status: 'error', error: 'failed', message: event.message || null }
      )
      return pump({ ...next, said: { id: item.id, name: item.name, what: event.ok ? 'done' : 'error', nonce: (state.said?.nonce ?? 0) + 1 } })
    }
    case 'CANCEL':
    case 'REMOVE': {
      if (!state.items.some((item) => item.id === event.id)) return state
      return pump(patch(state, event.id, () => null))
    }
    case 'RETRY':
      return pump(
        patch(state, event.id, (item) => (item.status === 'error' && item.error === 'failed' ? { ...item, status: 'waiting', error: null, message: null, progress: null } : item))
      )
    case 'RESET':
      return {
        ...state,
        items: event.files.map((file, index) => uploaded(`${state.id}-file-${state.seq + index + 1}`, file)),
        seq: state.seq + event.files.length,
        said: null,
      }
    case 'SYNC_OPTIONS': {
      let next = state
      for (const key of ['accept', 'maxSize', 'maxFiles', 'concurrency', 'disabled'] as const) {
        if (event[key] !== undefined && event[key] !== next[key]) next = { ...next, [key]: event[key] }
      }
      return next === state ? state : pump(next)
    }
  }
}

export interface UploadMachineConfig extends Partial<UploadOptions> {
  id: string
  /** Sends one file; see `UploadFunction`. Without one, a file is there as soon as it is chosen. */
  upload?: UploadFunction
  /** The files already there, shown as done. */
  defaultFiles?: UploadedFile[]
  /** The list changed: a file added, there, failed or taken off. Not called for progress. */
  onFilesChange?: (items: UploadItem[]) => void
}

export function initialState(config: UploadMachineConfig): UploadState {
  const files = config.defaultFiles ?? []
  return {
    id: config.id,
    accept: config.accept ?? DEFAULTS.accept,
    maxSize: config.maxSize ?? DEFAULTS.maxSize,
    maxFiles: config.maxFiles ?? DEFAULTS.maxFiles,
    concurrency: Math.max(1, config.concurrency ?? DEFAULTS.concurrency),
    disabled: config.disabled ?? DEFAULTS.disabled,
    items: files.map((file, index) => uploaded(`${config.id}-file-${index + 1}`, file)),
    seq: files.length,
    said: null,
  }
}

const messageOf = (reason: unknown) =>
  reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : undefined

/** What the owner hears about: which files, and where each stands — not how far. */
const shapeOf = (items: UploadItem[]) => items.map((item) => `${item.id}:${item.status}:${item.value ?? ''}`).join('|')

export type UploadMachine = Machine<UploadState, UploadEvent> & {
  /** Aborts every upload under way: the component is going. */
  dispose(): void
}

export function createUploadMachine(config: UploadMachineConfig): UploadMachine {
  const base = createMachine(initialState(config), reducer)
  // One controller per try under way; a file taken off, or tried again, aborts its old one.
  const going = new Map<string, { attempt: number; controller: AbortController }>()

  const start = (item: UploadItem) => {
    const { id, attempt } = item
    const controller = new AbortController()
    going.set(id, { attempt, controller })
    const settle = (ok: boolean, value?: string | null, message?: string | null) =>
      machine.send({ type: 'SETTLED', id, attempt, ok, value, message })
    // Answers come back later, never inside this transition: a synchronous throw waits a microtask too.
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      if (!config.upload || !item.file) return settle(true, null)
      let result: unknown
      try {
        result = config.upload(item.file, {
          signal: controller.signal,
          onProgress: (loaded, total) => {
            if (!controller.signal.aborted) machine.send({ type: 'PROGRESS', id, attempt, loaded, total })
          },
        })
      } catch (reason) {
        return settle(false, null, messageOf(reason))
      }
      Promise.resolve(result).then(
        (value) => settle(true, typeof value === 'string' ? value : null),
        (reason) => settle(false, null, messageOf(reason))
      )
    })
  }

  const machine: UploadMachine = {
    ...withEffects(base, (previous, next) => {
      const byId = new Map(next.items.map((item) => [item.id, item]))
      for (const [id, entry] of going) {
        const item = byId.get(id)
        if (item && item.attempt === entry.attempt && item.status !== 'uploading') going.delete(id)
        else if (!item || item.attempt !== entry.attempt) {
          entry.controller.abort()
          going.delete(id)
        }
      }
      for (const item of next.items) {
        if (item.status === 'uploading' && going.get(item.id)?.attempt !== item.attempt) start(item)
      }
      if (shapeOf(previous.items) !== shapeOf(next.items)) config.onFilesChange?.(next.items)
    }),
    dispose() {
      for (const entry of going.values()) entry.controller.abort()
      going.clear()
    },
  }
  return machine
}
