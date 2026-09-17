/** Instrument's vocabulary: an informational message is `neutral`, and a destructive result is `error`. */
export type ToastTone = 'neutral' | 'running' | 'ok' | 'warn' | 'error'

/** Where the region stands. Toasts grow from the edge: newest nearest it. */
export type ToastPlacement = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Pass one to update or dismiss the toast later; generated otherwise. */
  id?: string
  /** What happened. One line. */
  title: string
  /** The detail. */
  text?: string
  /** No tone: no icon. */
  tone?: ToastTone
  /**
   * How long it stays, in ms; 0 keeps it until dismissed. Default 5000, and 0
   * for `error`: a message that something did NOT happen may not leave unseen.
   */
  duration?: number
  /** One action, not two: a toast leaves by itself, and a choice takes time it does not have. */
  action?: ToastAction
}

export interface Toast {
  id: string
  title: string
  text?: string
  tone?: ToastTone
  duration: number
  action?: ToastAction
  /** `leaving` plays the exit before the toast is removed. */
  state: 'open' | 'leaving'
  /** Time left before it leaves, as of `startedAt`. */
  remaining: number
  /** When the current run of the timer began, or null while paused. */
  startedAt: number | null
  createdAt: number
}

export interface ToasterState {
  toasts: Toast[]
  /** The pointer or focus is on the region: every timer stands still (WCAG 2.2.1). */
  paused: boolean
  /** More than this are not shown at once: the oldest leaves. */
  max: number
  /** The newest message, for the live regions. The nonce makes a repeated message heard again. */
  announcement: { text: string; urgent: boolean; nonce: number }
}

export type ToasterEvent =
  | { type: 'ADD'; toast: ToastOptions & { id: string }; now: number }
  | { type: 'UPDATE'; id: string; patch: Partial<ToastOptions>; now: number }
  | { type: 'DISMISS'; id?: string }
  | { type: 'EXPIRE'; id: string; now: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
