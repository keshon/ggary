import type { Dict, Normalizer } from '../../types'
import { tooltipAnatomy } from './tooltip.anatomy'
import type { TooltipEvent, TooltipState } from './tooltip.types'

export const tooltipIds = (id: string) => ({ content: `${id}-content` })

/** Focus from a pointer is not a request for a tooltip; focus from the keyboard is. */
function focusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

/**
 * A tooltip DESCRIBES its trigger: `aria-describedby` points at the content
 * whether it shows or not, so a screen reader reads it on focus even when a
 * sighted user never hovers. It is never the only name of a control — an icon
 * button still needs its own `aria-label`.
 *
 * Nothing inside a tooltip is interactive; that would be a popover.
 */
export function connect<T = Dict>(state: TooltipState, send: (event: TooltipEvent) => void, normalize: Normalizer<T>) {
  const ids = tooltipIds(state.id)

  return {
    ids,
    open: state.open,
    placement: state.placement,
    dismiss: () => send({ type: 'ESCAPE' }),

    // Behaviour and ARIA only, merged onto the page's own element.
    triggerProps: normalize({
      'aria-describedby': ids.content,
      // A touch "hover" is the tap itself: it should act, not describe.
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType !== 'touch') send({ type: 'POINTER_ENTER' })
      },
      onPointerLeave: () => send({ type: 'POINTER_LEAVE' }),
      onFocus: (event: FocusEvent) => {
        if (focusVisible(event.currentTarget as Element)) send({ type: 'FOCUS' })
      },
      onBlur: () => send({ type: 'BLUR' }),
      onPointerDown: () => send({ type: 'PRESS' }),
    }),

    contentProps: normalize({
      ...tooltipAnatomy.attrs('content'),
      id: ids.content,
      role: 'tooltip',
      popover: 'manual',
      'data-state': state.open ? 'open' : 'closed',
      onPointerEnter: () => send({ type: 'CONTENT_ENTER' }),
      onPointerLeave: () => send({ type: 'CONTENT_LEAVE' }),
    }),
  }
}
