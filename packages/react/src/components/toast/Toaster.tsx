import { useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { connect, keepRegionOpen, toaster as pageToaster, type Toaster as ToasterStore, type ToastPlacement } from '@ggary/core/toast'
import { reactNormalizer } from '@ggary/core'

export interface ToasterProps {
  /** The queue to show. Default: the page's, which `toast()` adds to. */
  toaster?: ToasterStore
  placement?: ToastPlacement
  /** The region's accessible name. Default "Notifications". */
  label?: string
  closeLabel?: string
}

/**
 * The region toasts appear in. Render one per page, anywhere: it lives in the
 * top layer. Show a toast from anywhere with `toast({ title })`.
 */
export function Toaster({ toaster = pageToaster, placement, label, closeLabel }: ToasterProps) {
  const state = useSyncExternalStore(toaster.subscribe, toaster.getState, toaster.getState)
  const api = connect(state, toaster, reactNormalizer, { placement, label, closeLabel })

  // Opened once and kept open: a closed popover is display: none, and a live
  // region that is not displayed announces nothing.
  const region = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    if (region.current) keepRegionOpen(region.current)
  })

  return (
    <section ref={region} {...api.regionProps}>
      <div {...api.politeProps}>{api.politeText && <p key={state.announcement.nonce} {...api.announcementProps}>{api.politeText}</p>}</div>
      <div {...api.assertiveProps}>{api.assertiveText && <p key={state.announcement.nonce} {...api.announcementProps}>{api.assertiveText}</p>}</div>
      <ol {...api.listProps}>
        {api.toasts.map((toast) => (
          <li key={toast.id} {...api.getToastProps(toast)}>
            {toast.tone && <span {...api.getIconProps(toast)} />}
            <div {...api.bodyProps}>
              <p {...api.titleProps}>{toast.title}</p>
              {toast.text && <p {...api.textProps}>{toast.text}</p>}
            </div>
            {toast.action && <button {...api.getActionProps(toast)}>{toast.action.label}</button>}
            <button {...api.getCloseProps(toast)}>
              <span {...api.closeIconProps} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
