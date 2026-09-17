import { createMachine, type Machine } from '../../machine'
import type { Toast, ToasterEvent, ToasterState, ToastOptions } from './toast.types'

export const DEFAULT_DURATION = 5000
/** How long a leaving toast stays for its exit to play. Removal is by timer, so reduced motion still removes it. */
export const LEAVE_MS = 200
export const DEFAULT_MAX = 4

const defaultDuration = (options: ToastOptions) => options.duration ?? (options.tone === 'error' ? 0 : DEFAULT_DURATION)

const announce = (state: ToasterState, toast: Pick<Toast, 'title' | 'text' | 'tone'>) => ({
  text: toast.text ? `${toast.title}. ${toast.text}` : toast.title,
  urgent: toast.tone === 'error',
  nonce: state.announcement.nonce + 1,
})

function leave(toasts: Toast[], id: string | undefined): Toast[] {
  return toasts.map((toast) => (toast.state === 'open' && (id === undefined || toast.id === id) ? { ...toast, state: 'leaving' } : toast))
}

/** Stop a toast's clock, banking the time it has used. */
const stopClock = (toast: Toast, now: number): Toast =>
  toast.startedAt === null ? toast : { ...toast, remaining: Math.max(0, toast.remaining - (now - toast.startedAt)), startedAt: null }

/** Pure. Time arrives as `now` on the events that need it. */
export function reducer(state: ToasterState, event: ToasterEvent): ToasterState {
  switch (event.type) {
    case 'ADD': {
      if (state.toasts.some((toast) => toast.id === event.toast.id)) {
        return reducer(state, { type: 'UPDATE', id: event.toast.id, patch: event.toast, now: event.now })
      }
      const duration = defaultDuration(event.toast)
      const toast: Toast = {
        id: event.toast.id,
        title: event.toast.title,
        text: event.toast.text,
        tone: event.toast.tone,
        action: event.toast.action,
        duration,
        state: 'open',
        remaining: duration,
        startedAt: state.paused ? null : event.now,
        createdAt: event.now,
      }
      let toasts = [...state.toasts, toast]
      // The ceiling: the oldest open toasts leave so the new one is seen.
      const open = toasts.filter((candidate) => candidate.state === 'open')
      for (const old of open.slice(0, Math.max(0, open.length - state.max))) toasts = leave(toasts, old.id)
      return { ...state, toasts, announcement: announce(state, toast) }
    }

    case 'UPDATE': {
      const index = state.toasts.findIndex((toast) => toast.id === event.id)
      if (index === -1) return state
      const current = state.toasts[index]
      const { id: _id, ...patch } = event.patch
      const merged = { ...current, ...patch }
      const durationChanged = patch.duration !== undefined || (patch.tone !== undefined && patch.tone !== current.tone)
      // A tone without a duration takes that tone's default: "Saving…" held open, then "Saved" leaves.
      const duration = durationChanged ? defaultDuration({ ...merged, duration: patch.duration }) : current.duration
      // A new duration, or a new tone that changes the default, starts the clock again.
      const next: Toast = durationChanged
        ? { ...merged, duration, remaining: duration, startedAt: state.paused ? null : event.now, state: 'open' }
        : { ...merged, duration }
      const toasts = state.toasts.map((toast, i) => (i === index ? next : toast))
      const heard = patch.title !== undefined || patch.text !== undefined || patch.tone !== undefined
      return { ...state, toasts, announcement: heard ? announce(state, next) : state.announcement }
    }

    case 'DISMISS': {
      const toasts = leave(state.toasts, event.id)
      return toasts.every((toast, i) => toast === state.toasts[i]) ? state : { ...state, toasts }
    }

    case 'EXPIRE': {
      const toast = state.toasts.find((candidate) => candidate.id === event.id)
      // Only a running clock expires. A timer set before a pause was cleared by
      // the store, so one that arrives belongs to the current run.
      if (!toast || toast.state !== 'open' || state.paused || toast.duration === 0 || toast.startedAt === null) return state
      return { ...state, toasts: leave(state.toasts, event.id) }
    }

    case 'REMOVE': {
      const toasts = state.toasts.filter((toast) => toast.id !== event.id || toast.state !== 'leaving')
      return toasts.length === state.toasts.length ? state : { ...state, toasts }
    }

    case 'PAUSE':
      if (state.paused) return state
      return { ...state, paused: true, toasts: state.toasts.map((toast) => stopClock(toast, event.now)) }

    case 'RESUME':
      if (!state.paused) return state
      return {
        ...state,
        paused: false,
        toasts: state.toasts.map((toast) => (toast.state === 'open' ? { ...toast, startedAt: event.now } : toast)),
      }
  }
}

export interface Toaster {
  /** Show a toast. Returns its id. The same id again updates it: "Saving…" becomes "Saved". */
  toast(options: ToastOptions): string
  update(id: string, patch: Partial<ToastOptions>): void
  /** Dismiss one toast, or all of them. */
  dismiss(id?: string): void
  pause(): void
  resume(): void
  getState(): ToasterState
  subscribe(listener: (state: ToasterState) => void): () => void
}

export interface ToasterConfig {
  max?: number
  /** For tests: the clock. */
  now?: () => number
}

let counter = 0

/**
 * A queue of toasts that belongs to no framework: call `toast()` from anywhere
 * — an event handler, a fetch, a store — and every region subscribed to this
 * toaster renders it. The timers live here, not in a component, so a toast
 * keeps its time whichever region shows it, and none of them re-renders to
 * count down.
 */
export function createToaster(config: ToasterConfig = {}): Toaster {
  const now = config.now ?? (() => Date.now())
  const machine: Machine<ToasterState, ToasterEvent> = createMachine<ToasterState, ToasterEvent>(
    { toasts: [], paused: false, max: config.max ?? DEFAULT_MAX, announcement: { text: '', urgent: false, nonce: 0 } },
    reducer
  )

  // One timer per toast: an expiry while open and running, a removal while leaving.
  const timers = new Map<string, { kind: 'expire' | 'remove'; at: number | null; remaining: number; handle: ReturnType<typeof setTimeout> }>()
  const clear = (id: string) => {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer.handle)
    timers.delete(id)
  }

  const schedule = (state: ToasterState) => {
    const alive = new Set(state.toasts.map((toast) => toast.id))
    for (const id of [...timers.keys()]) if (!alive.has(id)) clear(id)
    for (const toast of state.toasts) {
      const timer = timers.get(toast.id)
      if (toast.state === 'leaving') {
        if (timer?.kind === 'remove') continue
        clear(toast.id)
        timers.set(toast.id, { kind: 'remove', at: null, remaining: LEAVE_MS, handle: setTimeout(() => machine.send({ type: 'REMOVE', id: toast.id }), LEAVE_MS) })
        continue
      }
      const running = toast.duration > 0 && toast.startedAt !== null && !state.paused
      if (!running) {
        clear(toast.id)
        continue
      }
      if (timer?.kind === 'expire' && timer.at === toast.startedAt && timer.remaining === toast.remaining) continue
      clear(toast.id)
      const handle = setTimeout(() => machine.send({ type: 'EXPIRE', id: toast.id, now: now() }), toast.remaining)
      timers.set(toast.id, { kind: 'expire', at: toast.startedAt, remaining: toast.remaining, handle })
    }
  }
  machine.subscribe(schedule)

  return {
    toast(options) {
      const id = options.id ?? `gg-toast-${++counter}`
      machine.send({ type: 'ADD', toast: { ...options, id }, now: now() })
      return id
    },
    update: (id, patch) => machine.send({ type: 'UPDATE', id, patch, now: now() }),
    dismiss: (id) => machine.send({ type: 'DISMISS', id }),
    pause: () => machine.send({ type: 'PAUSE', now: now() }),
    resume: () => machine.send({ type: 'RESUME', now: now() }),
    getState: machine.getState,
    subscribe: machine.subscribe,
  }
}

/** The page's toaster: what `toast()` and a region without a `toaster` of its own use. */
export const toaster: Toaster = createToaster()

/** Show a toast on the page's toaster. Returns its id. */
export const toast = (options: ToastOptions): string => toaster.toast(options)
