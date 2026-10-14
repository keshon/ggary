import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode, type CSSProperties } from 'react'
import { Dialog as Primitive } from '@base-ui/react/dialog'
import type { DialogChangeReason, DialogChangeDetails, DialogPlacement, DialogRole, DialogSize } from '@ggary/core/dialog'
import type { Dict } from '@ggary/core'
import { useConfig } from '../config-provider'

export interface DialogProps {
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: DialogChangeDetails) => void
  title?: ReactNode
  description?: ReactNode
  /** The body. Rendered only while open. */
  children?: ReactNode
  footer?: ReactNode
  /** Renders the opener: spread the props onto a button, `<Button {...props}>Open</Button>`. */
  trigger?: (props: Dict) => ReactNode
  size?: DialogSize
  /** `start` or `end` makes it a sheet at that edge. See also `Sheet`. */
  placement?: DialogPlacement
  modal?: boolean
  role?: DialogRole
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  /** The ✕ in the header. Default true. */
  closeButton?: boolean
  closeLabel?: string
}

/** Base UI interaction backend with GGary styling and callbacks. */
export function Dialog({ open, defaultOpen = false, onOpenChange, title, description,
  children, footer, trigger, size = 'md', placement = 'center', modal = true,
  role = 'dialog', closeOnEscape = true, closeOnOutside = true,
  closeButton = true, closeLabel = 'Close',
}: DialogProps) {
  const id = `gg-base-dialog-${useId().replace(/:/g, '')}`
  const config = useConfig()
  const anchor = useRef<HTMLDivElement>(null)
  const [inheritedStyle, setInheritedStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const shown = open ?? localOpen
  const request = useCallback((next: boolean, reason: DialogChangeReason, returnValue?: string) => {
    if (open === undefined) setLocalOpen(next)
    onOpenChange?.(next, returnValue === undefined ? { reason } : { reason, returnValue })
  }, [open, onOpenChange])
  useLayoutEffect(() => {
    if (!shown || !anchor.current) return
    const computed = getComputedStyle(anchor.current)
    const inherited: Record<string, string> = { direction: config.dir ?? computed.direction }
    for (let i = 0; i < computed.length; i++) {
      const property = computed[i]
      if (property.startsWith('--')) inherited[property] = computed.getPropertyValue(property)
    }
    setInheritedStyle(inherited)
  }, [shown, config])
  const part = (name: string) => ({ 'data-scope': 'dialog', 'data-part': name, 'data-backend': 'base-ui' })
  return <Primitive.Root open={shown} modal={modal} disablePointerDismissal={!closeOnOutside}
    onOpenChange={(next, details) => {
      if (details.reason === 'escape-key' && !closeOnEscape) { details.cancel(); return }
      const reason: DialogChangeReason = details.reason === 'trigger-press' ? 'trigger'
        : details.reason === 'close-press' ? 'close-button'
        : details.reason === 'escape-key' ? 'escape'
        : details.reason === 'outside-press' || details.reason === 'focus-out' ? 'outside' : 'api'
      request(next, reason)
    }}>
    <div {...part('anchor')} ref={anchor} style={{ display: 'contents' }}>
      {trigger && <Primitive.Trigger ref={triggerRef} id={`${id}-trigger`} render={(triggerProps) => trigger({ ...triggerProps, 'aria-expanded': shown ? 'true' : 'false' }) as ReactElement} />}
    </div>
    <Primitive.Portal keepMounted>
      <div {...part('layer')} data-mode={config.mode} dir={config.dir} lang={config.locale} style={inheritedStyle}>
        {modal && <Primitive.Backdrop {...part('backdrop')} />}
        <Primitive.Popup {...part('content')} finalFocus={trigger ? triggerRef : true} role={role} id={`${id}-content`}
          aria-modal={modal ? true : undefined}
          data-size={size} data-placement={placement} data-modal={modal ? '' : undefined}
          data-state={shown ? 'open' : 'closed'}
          onSubmit={(event) => {
            const form = event.target as HTMLFormElement
            if (form.tagName !== 'FORM' || form.closest('[data-scope="dialog"][data-part="content"]') !== event.currentTarget) return
            const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null
            const method = submitter?.getAttribute('formmethod') ?? form.getAttribute('method')
            if (method?.toLowerCase() !== 'dialog' || event.defaultPrevented) return
            event.preventDefault()
            request(false, 'native', submitter?.value ?? '')
          }}>
          {shown && <>
          {(title != null || description != null || closeButton) && <header {...part('header')}>
            {title != null && <Primitive.Title {...part('title')}>{title}</Primitive.Title>}
            {description != null && <Primitive.Description {...part('description')}>{description}</Primitive.Description>}
            {closeButton && <Primitive.Close {...part('close')} aria-label={closeLabel}>
              <span {...part('close-icon')} data-icon="close" aria-hidden="true" />
            </Primitive.Close>}
          </header>}
          <div {...part('body')}>{children}</div>
          {footer != null && <footer {...part('footer')}>{footer}</footer>}
          </>}
        </Primitive.Popup>
      </div>
    </Primitive.Portal>
  </Primitive.Root>
}
