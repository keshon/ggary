import { trackDismissable, type DismissableOptions } from './dismissable'
import { attachPositioner, type PositionOptions, type VirtualElement } from './position'

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
  /**
   * Put the element on the dismiss stack. Default true. A submenu does not: its
   * menu is the layer, and hears Escape and presses outside for the whole tree.
   */
  dismissable?: boolean
  exclude?: (HTMLElement | null)[]
  /**
   * Where to stand, when it is not the reference: a context menu stands at
   * the pointer, and still returns focus to the reference when it closes.
   */
  anchor?: Element | VirtualElement
  /**
   * A press on the reference is not "outside". Default true: a trigger's own
   * press toggles. A context menu's reference is the whole grid, and a press
   * there should close the menu like any other.
   */
  excludeReference?: boolean
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

export function firstFocusable(content: HTMLElement): HTMLElement {
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
    attachPositioner(options.anchor ?? reference, content, {
      placement: options.placement,
      gutter: options.gutter,
      crossOffset: options.crossOffset,
      onPlaced: () => options.onPlaced?.(),
      sameWidth: options.sameWidth ?? false,
      strategy: 'fixed',
    })

  const layerOptions: DismissableOptions = {
    onDismiss: (reason) => options.onDismiss(reason === 'escape' ? 'escape' : 'outside'),
    exclude: [...(options.excludeReference === false ? [] : [reference]), ...(options.exclude ?? [])],
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
  const release = options.dismissable === false ? () => {} : trackDismissable(content, layerOptions)

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

/** An element's padding plus border above its content, and at its inline end, in px. */
export function contentInsets(element: Element): { top: number; inlineEnd: number } {
  const style = getComputedStyle(element)
  const px = (value: string) => parseFloat(value) || 0
  return {
    top: px(style.paddingTop) + px(style.borderTopWidth),
    inlineEnd: px(style.paddingInlineEnd) + px(style.borderInlineEndWidth),
  }
}

/**
 * Where a submenu goes relative to the row that opens it: clear of the parent
 * panel's padding and border by a hair, and slid up by its own, so its first
 * row lines up with the row that opened it.
 */
export function submenuOffsets(row: Element, submenu: Element): { gutter: number; crossOffset: number } {
  const panel = row.parentElement?.closest('[role="menu"]')
  return {
    gutter: (panel ? contentInsets(panel).inlineEnd : 0) + 2,
    crossOffset: -contentInsets(submenu).top,
  }
}
