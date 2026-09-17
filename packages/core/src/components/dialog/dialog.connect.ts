import type { Dict, Normalizer } from '../../types'
import { dialogAnatomy } from './dialog.anatomy'
import type { DialogChangeReason, DialogEvent, DialogSize, DialogState } from './dialog.types'

export const dialogIds = (id: string) => ({
  trigger: `${id}-trigger`,
  content: `${id}-content`,
  title: `${id}-title`,
  description: `${id}-description`,
})

export interface DialogConnectOptions {
  /** Whether a title part is rendered; it then names the dialog. */
  title?: boolean
  description?: boolean
  size?: DialogSize
  /** The close button's accessible name. */
  closeLabel?: string
}

/**
 * The <dialog> element is the `content` part. Header, body and footer are
 * layout parts inside it; the ::backdrop is the element's own and is styled
 * on `content`.
 *
 * Showing and hiding the element is not in these props — no attribute can
 * call showModal(). The adapter watches `open` and hands the element to
 * `attachDialog`, with `dismiss` and `nativeClose` as its callbacks.
 */
export function connect<T = Dict>(
  state: DialogState,
  send: (event: DialogEvent) => void,
  normalize: Normalizer<T>,
  options: DialogConnectOptions = {}
) {
  const ids = dialogIds(state.id)
  const { size = 'md', closeLabel = 'Close' } = options
  const stateAttr = state.open ? 'open' : 'closed'

  return {
    ids,
    open: state.open,
    modal: state.modal,
    closeOnEscape: state.closeOnEscape,
    closeOnOutside: state.closeOnOutside,

    show: () => send({ type: 'OPEN', reason: 'api' }),
    close: () => send({ type: 'CLOSE', reason: 'api' }),
    dismiss: (reason: Extract<DialogChangeReason, 'escape' | 'outside'>) => send({ type: 'CLOSE', reason }),
    nativeClose: (returnValue?: string) => send({ type: 'CLOSE', reason: 'native', returnValue }),

    // The trigger is always someone else's element — a Button, a menu item, a
    // link — so it gets behaviour and ARIA, and no data-scope, data-part or
    // data-state: those would overwrite the ones its own component set, and a
    // Button spread with them stops being styled as a button. Style an open
    // trigger with [aria-expanded='true'].
    triggerProps: normalize({
      id: ids.trigger,
      type: 'button',
      'aria-haspopup': 'dialog',
      'aria-expanded': state.open ? 'true' : 'false',
      'aria-controls': ids.content,
      onClick: () => send({ type: 'OPEN', reason: 'trigger' }),
    }),

    contentProps: normalize({
      ...dialogAnatomy.attrs('content'),
      id: ids.content,
      // <dialog> is already role=dialog; only the alert variant says so.
      role: state.role === 'alertdialog' ? 'alertdialog' : undefined,
      'aria-labelledby': options.title ? ids.title : undefined,
      'aria-describedby': options.description ? ids.description : undefined,
      // Focusable itself, so showModal() has somewhere to put focus when the
      // dialog holds nothing interactive.
      tabIndex: -1,
      'data-state': stateAttr,
      'data-size': size,
      'data-modal': state.modal ? '' : undefined,
    }),

    headerProps: normalize({ ...dialogAnatomy.attrs('header') }),
    titleProps: normalize({ ...dialogAnatomy.attrs('title'), id: ids.title }),
    descriptionProps: normalize({ ...dialogAnatomy.attrs('description'), id: ids.description }),
    bodyProps: normalize({ ...dialogAnatomy.attrs('body') }),
    footerProps: normalize({ ...dialogAnatomy.attrs('footer') }),

    closeProps: normalize({
      ...dialogAnatomy.attrs('close'),
      type: 'button',
      'aria-label': closeLabel,
      onClick: () => send({ type: 'CLOSE', reason: 'close-button' }),
    }),
    // A child part, as chip's remove-icon: the mask would clip a tap area on `close`.
    closeIconProps: normalize({ ...dialogAnatomy.attrs('close-icon'), 'aria-hidden': 'true', 'data-icon': 'close' }),
  }
}
