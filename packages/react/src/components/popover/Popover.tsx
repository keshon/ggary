import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode, type ReactElement, type CSSProperties } from 'react'
import { Popover as Primitive } from '@base-ui/react/popover'
import { type Dict } from '@ggary/core'
import type { PopoverChangeDetails, PopoverPlacement } from '@ggary/core/popover'
import { useConfig } from '../config-provider'

export interface PopoverProps {
  /** Controlled. Omit and use `defaultOpen` for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: PopoverChangeDetails) => void
  /** The anchor and opener: spread the props onto a button. */
  trigger: (props: Dict) => ReactNode
  title?: ReactNode
  /** The content. Rendered only while open. */
  children?: ReactNode
  placement?: PopoverPlacement
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  /** A ✕ in the corner. Default false: a popover usually closes on a press outside. */
  closeButton?: boolean
  closeLabel?: string
}

export function Popover({ open, defaultOpen = false, onOpenChange, trigger, title, children,
  placement = 'bottom-start', closeOnEscape = true, closeOnOutside = true,
  closeButton = false, closeLabel = 'Close',
}: PopoverProps) {
  const id = `gg-base-popover-${useId().replace(/:/g, '')}`
  const config = useConfig()
  const anchor = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [localOpen, setLocalOpen] = useState(defaultOpen)
  const shown = open ?? localOpen
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined)
  const [inheritedStyle, setInheritedStyle] = useState<CSSProperties>({})
  const request = useCallback((next: boolean, reason: PopoverChangeDetails['reason']) => {
    if (open === undefined) setLocalOpen(next)
    onOpenChange?.(next, { reason })
  }, [open, onOpenChange])
  useLayoutEffect(() => {
    if (!shown || !anchor.current) return
    const computed = getComputedStyle(anchor.current)
    const style: Record<string, string> = { direction: config.dir ?? computed.direction }
    for (let i = 0; i < computed.length; i++) {
      const key = computed[i]
      if (key.startsWith('--')) style[key] = computed.getPropertyValue(key)
    }
    setInheritedStyle(style)
    setContainer(anchor.current.closest<HTMLElement>('[data-backend="base-ui"]:is([data-scope="dialog"][data-part="layer"], [data-scope="popover"][data-part="positioner"])') ?? undefined)
  }, [shown, config])
  const [side, alignment] = placement.split('-')
  const part = (name: string) => ({ 'data-scope': 'popover', 'data-part': name, 'data-backend': 'base-ui' })
  return <Primitive.Root open={shown} triggerId={`${id}-trigger`} modal={false}
    onOpenChange={(next, details) => {
      if ((details.reason === 'escape-key' && !closeOnEscape) ||
        ((details.reason === 'outside-press' || details.reason === 'focus-out') && !closeOnOutside)) {
        details.cancel(); return
      }
      request(next, details.reason === 'trigger-press' ? 'trigger'
        : details.reason === 'close-press' ? 'close-button'
        : details.reason === 'escape-key' ? 'escape'
        : details.reason === 'outside-press' || details.reason === 'focus-out' ? 'outside' : 'api')
    }}>
    <div {...part('anchor')} ref={anchor} style={{ display: 'contents' }}>
      <Primitive.Trigger ref={triggerRef} id={`${id}-trigger`} render={(props) =>
        trigger({ ...props, 'aria-expanded': shown ? 'true' : 'false' }) as ReactElement} />
    </div>
    <Primitive.Portal keepMounted container={container}>
      <Primitive.Positioner {...part('positioner')} positionMethod="fixed"
        side={side as 'top' | 'bottom' | 'left' | 'right'} align={(alignment ?? 'center') as 'start' | 'end' | 'center'}
        sideOffset={6} data-mode={config.mode} dir={config.dir} lang={config.locale} style={{ ...inheritedStyle, '--gg-available-width': 'var(--available-width, 100vw)' } as CSSProperties}>
        <Primitive.Popup {...part('content')} id={`${id}-content`}
          data-state={shown ? 'open' : 'closed'} finalFocus={triggerRef}>
          {shown && <>
            {title != null && <Primitive.Title {...part('title')}>{title}</Primitive.Title>}
            {closeButton && <Primitive.Close {...part('close')} aria-label={closeLabel}>
              <span {...part('close-icon')} data-icon="close" aria-hidden="true" />
            </Primitive.Close>}
            {children}
          </>}
        </Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  </Primitive.Root>
}
