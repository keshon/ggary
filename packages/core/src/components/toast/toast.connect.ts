import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { toastAnatomy } from './toast.anatomy'
import type { Toaster } from './toast.store'
import type { Toast, ToasterState, ToastPlacement, ToastTone } from './toast.types'

export interface ToasterConnectOptions {
  /** The region's accessible name. Default "Notifications". */
  label?: string
  placement?: ToastPlacement
  /** The close button's accessible name. Default "Dismiss". */
  closeLabel?: string
}

const TONE_ICONS: Record<ToastTone, IconName> = {
  neutral: 'status-info',
  running: 'status-info',
  ok: 'status-ok',
  warn: 'status-warn',
  error: 'status-error',
}

/**
 * The region toasts appear in, and each toast in it.
 *
 * The region is a manual popover opened once and never closed: toasts have to
 * float over everything the application drew, and a live region that is
 * display: none announces nothing. It takes no pointer events itself.
 *
 * Toasts are announced by two live regions that exist before any toast does —
 * polite, and assertive for an error — rather than by the toasts, because a
 * live region created together with its content is not reliably spoken. The
 * visible toasts carry no live role, so nothing is announced twice.
 */
export function connect<T = Dict>(state: ToasterState, toaster: Toaster, normalize: Normalizer<T>, options: ToasterConnectOptions = {}) {
  const { label = 'Notifications', placement = 'bottom-end', closeLabel = 'Dismiss' } = options

  return {
    toasts: state.toasts,
    announcement: state.announcement,
    /** The live text for each announcer; the other one is empty. */
    politeText: state.announcement.urgent ? '' : state.announcement.text,
    assertiveText: state.announcement.urgent ? state.announcement.text : '',

    regionProps: normalize({
      ...toastAnatomy.attrs('region'),
      role: 'region',
      'aria-label': label,
      popover: 'manual',
      'data-placement': placement,
      'data-paused': state.paused ? '' : undefined,
      // Time stands still while someone is reading or reaching for an action.
      onPointerEnter: () => toaster.pause(),
      onPointerLeave: () => toaster.resume(),
      onFocusIn: () => toaster.pause(),
      onFocusOut: (event: FocusEvent) => {
        const region = event.currentTarget as Element | null
        if (!region?.contains(event.relatedTarget as Node | null)) toaster.resume()
      },
    }),

    listProps: normalize({ ...toastAnatomy.attrs('list'), 'data-placement': placement }),

    politeProps: normalize({ ...toastAnatomy.attrs('announcer'), 'aria-live': 'polite', 'aria-atomic': 'true', 'data-urgency': 'polite' }),
    assertiveProps: normalize({ ...toastAnatomy.attrs('announcer'), 'aria-live': 'assertive', 'aria-atomic': 'true', 'data-urgency': 'assertive' }),

    getToastProps: (toast: Toast) =>
      normalize({
        ...toastAnatomy.attrs('toast'),
        id: toast.id,
        'data-tone': toast.tone,
        'data-state': toast.state,
        'data-placement': placement,
      }),

    /** Rendered only for a toast with a tone. */
    getIconProps: (toast: Toast) =>
      normalize({ ...toastAnatomy.attrs('icon'), 'data-icon': toast.tone ? TONE_ICONS[toast.tone] : undefined, 'aria-hidden': 'true' }),

    bodyProps: normalize({ ...toastAnatomy.attrs('body') }),
    titleProps: normalize({ ...toastAnatomy.attrs('title') }),
    textProps: normalize({ ...toastAnatomy.attrs('text') }),

    getActionProps: (toast: Toast) =>
      normalize({
        ...toastAnatomy.attrs('action'),
        type: 'button',
        onClick: () => {
          toast.action?.onClick()
          toaster.dismiss(toast.id)
        },
      }),

    getCloseProps: (toast: Toast) =>
      normalize({
        ...toastAnatomy.attrs('close'),
        type: 'button',
        'aria-label': closeLabel,
        onClick: () => toaster.dismiss(toast.id),
      }),

    closeIconProps: normalize({ ...toastAnatomy.attrs('close-icon'), 'data-icon': 'close' satisfies IconName, 'aria-hidden': 'true' }),
  }
}

export type ToasterApi<T = Dict> = ReturnType<typeof connect<T>>

/** Keep a region in the top layer: opened once, and again if it was ever closed. */
export function keepRegionOpen(region: HTMLElement): void {
  if (typeof region.showPopover !== 'function' || !region.hasAttribute('popover')) return
  try {
    // A browser without :popover-open (or a test DOM) throws on the selector; showing again is harmless.
    if (region.matches(':popover-open')) return
  } catch {}
  try {
    region.showPopover()
  } catch {
    // Disconnected: nothing to show.
  }
}
