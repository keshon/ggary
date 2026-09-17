import { trackDismissable, type DismissableOptions } from './dismissable'

export interface AttachDialogOptions {
  modal: boolean
  closeOnEscape: boolean
  closeOnOutside: boolean
  /** The user asked to leave: Escape, a platform close request, or a press outside. */
  onDismiss: (reason: 'escape' | 'outside') => void
  /**
   * A <form method="dialog"> inside was submitted, with its submitter's value —
   * or something other than this helper closed the element.
   */
  onNativeClose?: (returnValue: string) => void
  /** Elements that count as inside, such as the trigger. */
  exclude?: (HTMLElement | null)[]
  /**
   * Where focus goes on close when nothing had focus before opening — usually
   * the trigger. Safari does not focus a button when it is clicked, so there
   * the page's focus before opening is <body>, and restoring it strands a
   * keyboard user at the top of the document.
   */
  finalFocus?: HTMLElement | null
}

export interface AttachedDialog {
  update(options: Partial<AttachDialogOptions>): void
  destroy(): void
}

/**
 * Show a native <dialog> and keep it honest until `destroy()`.
 *
 * The platform does most of the work, and that is the point of using it:
 * showModal() puts the dialog in the TOP LAYER — above every z-index, never
 * clipped by an ancestor's overflow, so no portal is needed — makes the rest
 * of the page inert, which is a focus trap without a line of trap code, and
 * moves focus inside. What it leaves to us:
 *
 *   - Which layer an Escape or an outside press belongs to. The dialog joins
 *     the dismiss stack, so a listbox open inside it closes first.
 *   - Closing through state, not natively. A close request is cancelled and
 *     reported; the adapter closes the element when the state says so.
 *   - Focus back where it was. Recent browsers restore it themselves; older
 *     ones do not, and restoring twice is harmless.
 */
export function attachDialog(el: HTMLDialogElement, initial: AttachDialogOptions): AttachedDialog {
  const doc = el.ownerDocument
  const options = { ...initial }
  const active = doc.activeElement as HTMLElement | null
  const returnFocus = active && active !== doc.body ? active : (initial.finalFocus ?? null)

  // A press on a modal dialog's ::backdrop is targeted at the dialog element
  // itself, so "outside" is a question of geometry there. A press on the
  // dialog's own padding is also targeted at it, and is inside the box.
  const outsideBox = (event: PointerEvent) => {
    if (event.target !== el) return !el.contains(event.target as Node)
    const box = el.getBoundingClientRect()
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
  }

  const layerOptions: DismissableOptions = {
    onDismiss: (reason) => options.onDismiss(reason === 'escape' ? 'escape' : 'outside'),
    exclude: options.exclude,
    isOutside: outsideBox,
  }
  const syncLayer = () =>
    Object.assign(layerOptions, { closeOnEscape: options.closeOnEscape, closeOnOutside: options.closeOnOutside })
  syncLayer()

  // Escape from a keyboard never gets here — the stack prevents the keydown,
  // and a prevented keydown makes no close request. This is for the others: a
  // back gesture, an assistive-tech dismiss.
  const onCancel = (event: Event) => {
    event.preventDefault()
    if (options.closeOnEscape) options.onDismiss('escape')
  }
  // A <form method="dialog"> closes through state like everything else: its
  // submission is intercepted, not left to close the element. The submit event
  // is synchronous and carries the submitter, where the native `close` event is
  // queued — and in a page that is not rendering, a hidden tab, it can wait
  // indefinitely, leaving the state saying "open" over a closed element. It
  // also lets a controlled owner refuse this close like any other. A handler
  // of the page's own that prevents the submit (validation) wins: it ran first.
  const onSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement
    if (event.defaultPrevented || form.method !== 'dialog' || form.closest('dialog') !== el) return
    event.preventDefault()
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null
    el.returnValue = submitter?.value ?? ''
    options.onNativeClose?.(el.returnValue)
  }

  // Anything else that closes the element — close() called by other code. The
  // event is queued, after close() has returned, so a close this helper makes
  // itself is counted rather than unsubscribed from.
  let ownCloses = 0
  const onClose = () => {
    if (ownCloses > 0) ownCloses--
    else options.onNativeClose?.(el.returnValue)
  }

  const show = () => {
    if (el.open) return
    if (options.modal) el.showModal()
    else el.show()
  }

  el.addEventListener('cancel', onCancel)
  el.addEventListener('submit', onSubmit)
  el.addEventListener('close', onClose)
  show()
  const release = trackDismissable(el, layerOptions)

  return {
    update(next) {
      const modalChanged = next.modal !== undefined && next.modal !== options.modal
      Object.assign(options, next)
      syncLayer()
      if (modalChanged && el.open) {
        // The mode is fixed when a dialog is shown; changing it means showing again.
        ownCloses++
        el.close()
        show()
      }
    },
    destroy() {
      release()
      // Listeners go first: this close is the state's doing, not a native one.
      el.removeEventListener('cancel', onCancel)
      el.removeEventListener('submit', onSubmit)
      el.removeEventListener('close', onClose)
      if (el.open) el.close()
      const active = doc.activeElement
      const focusWasInside = !active || active === doc.body || el.contains(active)
      if (focusWasInside && returnFocus?.isConnected && typeof returnFocus.focus === 'function') {
        returnFocus.focus({ preventScroll: true })
      }
    },
  }
}
