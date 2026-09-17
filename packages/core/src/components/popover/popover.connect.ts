import type { Dict, Normalizer } from '../../types'
import { popoverAnatomy } from './popover.anatomy'
import type { PopoverEvent, PopoverState } from './popover.types'

export const popoverIds = (id: string) => ({
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  title: `${id}-title`,
})

export interface PopoverConnectOptions {
  title?: boolean
  closeLabel?: string
}

/**
 * A non-modal dialog anchored to its trigger: filters, a settings panel, a
 * small form. It takes focus when it opens and gives it back when it closes,
 * but the page stays live around it.
 *
 * Showing, placing and dismissing the element are `attachPopover`'s job; the
 * adapter hands it the content when `open` turns true.
 */
export function connect<T = Dict>(
  state: PopoverState,
  send: (event: PopoverEvent) => void,
  normalize: Normalizer<T>,
  options: PopoverConnectOptions = {}
) {
  const ids = popoverIds(state.id)
  const stateAttr = state.open ? 'open' : 'closed'

  return {
    ids,
    open: state.open,
    placement: state.placement,
    closeOnEscape: state.closeOnEscape,
    closeOnOutside: state.closeOnOutside,

    show: () => send({ type: 'OPEN', reason: 'api' }),
    close: () => send({ type: 'CLOSE', reason: 'api' }),
    dismiss: (reason: 'escape' | 'outside') => send({ type: 'CLOSE', reason }),

    // Behaviour and ARIA only, as Dialog's trigger: see dialog.connect.
    triggerProps: normalize({
      id: ids.trigger,
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      onClick: () => send({ type: 'TOGGLE', reason: 'trigger' }),
    }),

    contentProps: normalize({
      ...popoverAnatomy.attrs('content'),
      id: ids.content,
      role: 'dialog',
      'aria-labelledby': options.title ? ids.title : undefined,
      tabIndex: -1,
      popover: 'manual',
      'data-state': stateAttr,
    }),

    titleProps: normalize({ ...popoverAnatomy.attrs('title'), id: ids.title }),
    closeProps: normalize({
      ...popoverAnatomy.attrs('close'),
      type: 'button',
      'aria-label': options.closeLabel ?? 'Close',
      onClick: () => send({ type: 'CLOSE', reason: 'close-button' }),
    }),
    closeIconProps: normalize({ ...popoverAnatomy.attrs('close-icon'), 'aria-hidden': 'true', 'data-icon': 'close' }),
  }
}
