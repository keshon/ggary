export type DialogRole = 'dialog' | 'alertdialog'

/** Why a dialog opened or closed, as `onOpenChange` reports it. */
export type DialogChangeReason =
  | 'trigger'
  /** Escape, or the platform's own close request (a back gesture). */
  | 'escape'
  /** A press on the backdrop, or outside a non-modal dialog. */
  | 'outside'
  | 'close-button'
  /** The native element closed itself: a <form method="dialog"> was submitted. */
  | 'native'
  /** `open()` / `close()` called from code. */
  | 'api'

export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogChangeDetails {
  reason: DialogChangeReason
  /** Present when a <form method="dialog"> closed it: the submitting button's value. */
  returnValue?: string
}

export interface DialogOptions {
  /** Modal blocks the page (showModal); non-modal floats over it (show). Default true. */
  modal: boolean
  /** `alertdialog`: an interruption that demands a response. Default `dialog`. */
  role: DialogRole
  closeOnEscape: boolean
  closeOnOutside: boolean
}

export interface DialogState extends DialogOptions {
  id: string
  open: boolean
  /** Controlled: the machine reports intent and never moves `open` itself. */
  controlled: boolean
  /** The last open state the USER or code asked for; see SelectState.intent. */
  intent: { open: boolean; reason: DialogChangeReason; returnValue?: string; nonce: number }
}

export type DialogEvent =
  | { type: 'OPEN'; reason?: DialogChangeReason }
  /** `returnValue`: the value of the button that submitted a <form method="dialog">. */
  | { type: 'CLOSE'; reason: DialogChangeReason; returnValue?: string }
  | { type: 'SYNC_OPEN'; open: boolean }
  | ({ type: 'SYNC_OPTIONS' } & Partial<DialogOptions>)
