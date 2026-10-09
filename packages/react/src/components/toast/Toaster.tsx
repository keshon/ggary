import { useEffect, useLayoutEffect, useRef } from 'react'
import { Toast as Primitive } from '@base-ui/react/toast'
import { keepRegionOpen, type ToastOptions, type ToastPlacement } from '@ggary/core/toast'
import { TONE_ICONS } from '@ggary/core'
import { toaster as pageToaster, type ToasterStore } from './toaster-store'

export interface ToasterProps {
  toaster?: ToasterStore
  placement?: ToastPlacement
  label?: string
  closeLabel?: string
}
const part = (name: string) => ({ 'data-scope': 'toast', 'data-part': name })
function ToastRegion({ placement = 'bottom-end', label = 'Notifications', closeLabel = 'Dismiss' }: Omit<ToasterProps, 'toaster'>) {
  const { toasts } = Primitive.useToastManager<ToastOptions>()
  const region = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (region.current) keepRegionOpen(region.current) })
  return <Primitive.Portal>
    <Primitive.Viewport ref={element => { region.current = element; if (element) keepRegionOpen(element) }} {...part('region')} popover="manual" role="region" aria-label={label} data-placement={placement} data-backend="base-ui">
      <div {...part('list')} data-placement={placement}>
        {[...toasts].reverse().map(toast => <Primitive.Root key={toast.id} toast={toast} {...part('toast')} id={toast.id}
          data-tone={toast.type} data-state={toast.transitionStatus === 'ending' ? 'leaving' : 'open'} data-placement={placement}
          style={toast.limited ? { display: 'none' } : undefined}>
          {toast.data?.tone && <span {...part('icon')} data-icon={TONE_ICONS[toast.data.tone]} aria-hidden="true" />}
          <Primitive.Content {...part('body')}>
            <Primitive.Title {...part('title')} />
            {toast.description && <Primitive.Description {...part('text')} />}
          </Primitive.Content>
          {toast.actionProps && <Primitive.Action {...part('action')} />}
          <Primitive.Close {...part('close')} aria-label={closeLabel}><span {...part('close-icon')} data-icon="close" aria-hidden="true" /></Primitive.Close>
        </Primitive.Root>)}
      </div>
    </Primitive.Viewport>
  </Primitive.Portal>
}
export function Toaster({ toaster = pageToaster, ...props }: ToasterProps) {
  // Child provider subscriptions mount before this parent effect flushes pre-mount commands.
  useEffect(() => toaster.attach(), [toaster])
  return <Primitive.Provider toastManager={toaster.manager} limit={toaster.max}><ToastRegion {...props} /></Primitive.Provider>
}
