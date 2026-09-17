import { trackDismissable, type DismissableOptions } from './dismissable'
import { attachPositioner, type PositionOptions } from './position'

export interface AttachPopoverOptions extends Omit<PositionOptions, 'strategy'> {
  onDismiss: (reason: 'escape' | 'outside') => void
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  /** Presses belong to the layer below; see DismissableOptions.passive. */
  passive?: boolean
  /**
   * Move focus into the content on open, and back to the reference on close.
   * A popover holding controls wants it; a tooltip and a listbox whose focus
   * stays on its trigger do not.
   */
  manageFocus?: boolean
  exclude?: (HTMLElement | null)[]
}

export interface AttachedPopover {
  update(options: Partial<AttachPopoverOptions>): void
  destroy(): void
}

const focusable =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Rendered, so focus can land. checkVisibility where the platform has it; `hidden` otherwise. */
const visible = (el: HTMLElement) =>
  typeof el.checkVisibility === 'function' ? el.checkVisibility() : !el.closest('[hidden]')

function firstFocusable(content: HTMLElement): HTMLElement {
  const autofocus = content.querySelector<HTMLElement>('[autofocus]')
  if (autofocus && visible(autofocus)) return autofocus
  return [...content.querySelectorAll<HTMLElement>(focusable)].find(visible) ?? content
}

/**
 * Show an element with the `popover` attribute next to its reference and keep
 * it there until `destroy()`.
 *
 * `popover="manual"` puts it in the TOP LAYER — the same guarantee a modal
 * dialog gets: no ancestor's overflow clips it and no z-index outranks it, so
 * nothing is portalled and the element stays where the component rendered it.
 * "manual", not "auto": the platform's light dismiss would compete with the
 * dismiss stack, and a trigger's own click would close and reopen it.
 *
 * Floating UI places it with the `fixed` strategy, because a top-layer element
 * is positioned against the viewport whatever its DOM parent is.
 */
export function attachPopover(reference: HTMLElement, content: HTMLElement, initial: AttachPopoverOptions): AttachedPopover {
  const doc = content.ownerDocument
  const options = { ...initial }

  const show = () => {
    if (content.hasAttribute('popover') && typeof content.showPopover === 'function') {
      try {
        content.showPopover()
      } catch {
        // Already open, or disconnected: both leave nothing to do.
      }
    }
  }
  const hide = () => {
    if (content.hasAttribute('popover') && typeof content.hidePopover === 'function') {
      try {
        content.hidePopover()
      } catch {
        // Already hidden.
      }
    }
  }

  const position = () =>
    attachPositioner(reference, content, {
      placement: options.placement,
      gutter: options.gutter,
      sameWidth: options.sameWidth ?? false,
      strategy: 'fixed',
    })

  const layerOptions: DismissableOptions = {
    onDismiss: (reason) => options.onDismiss(reason === 'escape' ? 'escape' : 'outside'),
    exclude: [reference, ...(options.exclude ?? [])],
  }
  const syncLayer = () =>
    Object.assign(layerOptions, {
      closeOnEscape: options.closeOnEscape,
      closeOnOutside: options.closeOnOutside,
      passive: options.passive,
    })
  syncLayer()

  show()
  let stopPositioning = position()
  const release = trackDismissable(content, layerOptions)

  if (options.manageFocus) {
    firstFocusable(content).focus({ preventScroll: true })
  }

  return {
    update(next) {
      const moved =
        (next.placement !== undefined && next.placement !== options.placement) ||
        (next.gutter !== undefined && next.gutter !== options.gutter)
      Object.assign(options, next)
      syncLayer()
      if (moved) {
        stopPositioning()
        stopPositioning = position()
      }
    },
    destroy() {
      release()
      stopPositioning()
      const active = doc.activeElement
      const focusWasInside = !active || active === doc.body || content.contains(active)
      hide()
      if (options.manageFocus && focusWasInside && reference.isConnected) reference.focus({ preventScroll: true })
    },
  }
}
