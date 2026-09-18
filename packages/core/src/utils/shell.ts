import { trackDismissable } from './dismissable'
import { firstFocusable } from './popover'
import { SHELL_NARROW } from '../components/shell/shell.connect'

export interface ShellDrawerOptions {
  /** The drawer asks to close: Escape, a press outside it, or the window growing past the breakpoint. */
  onDismiss: (reason: 'escape' | 'outside' | 'resize') => void
  /** The query that makes the column a drawer. Default SHELL_NARROW. */
  query?: string
}

/**
 * An open drawer, kept while it is open. Call on open; destroy() on close.
 *
 * On a narrow screen it behaves as the modal it looks like: the rest of the
 * shell is inert — no Tab walks out of the drawer into the page under the
 * scrim — the focus goes into the drawer, Escape and a press outside close
 * it, and the focus comes back to the toggle. On a wide screen the column is
 * simply the column and none of that applies; a window that grows past the
 * breakpoint while the drawer is open closes it, so it is not found open the
 * next time the window narrows.
 */
export function attachShellDrawer(root: HTMLElement, aside: HTMLElement, toggle: HTMLElement | null, options: ShellDrawerOptions): () => void {
  const view = root.ownerDocument.defaultView
  const narrow = view?.matchMedia?.(options.query ?? SHELL_NARROW)
  let release: (() => void) | null = null
  let inert: HTMLElement[] = []

  const engage = () => {
    if (release) return
    release = trackDismissable(aside, {
      onDismiss: (reason) => options.onDismiss(reason === 'escape' ? 'escape' : 'outside'),
      exclude: [toggle],
    })
    inert = [...root.children].filter((child): child is HTMLElement => child !== aside && child instanceof HTMLElement && !child.inert)
    for (const child of inert) child.inert = true
    const focus = () => firstFocusable(aside).focus({ preventScroll: true })
    focus()
    // A theme that fades the drawer in from hidden refuses the focus for a
    // frame; ask again once it is drawn.
    if (!aside.contains(root.ownerDocument.activeElement)) view?.requestAnimationFrame(() => release && focus())
  }

  const disengage = (restore: boolean) => {
    if (!release) return
    release()
    release = null
    for (const child of inert) child.inert = false
    inert = []
    const active = root.ownerDocument.activeElement
    const focusWasInside = !active || active === root.ownerDocument.body || aside.contains(active)
    if (restore && focusWasInside && toggle?.isConnected) toggle.focus({ preventScroll: true })
  }

  // No matchMedia (an old test environment): behave as narrow — the drawer exists only because someone opened it.
  if (!narrow || narrow.matches) engage()
  const onChange = () => {
    if (narrow?.matches) return
    disengage(false)
    options.onDismiss('resize')
  }
  narrow?.addEventListener?.('change', onChange)

  return () => {
    narrow?.removeEventListener?.('change', onChange)
    disengage(true)
  }
}
