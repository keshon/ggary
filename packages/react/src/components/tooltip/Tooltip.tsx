import { useId, useRef, useState, type ReactNode, type ReactElement } from 'react'
import { Tooltip as Primitive } from '@base-ui/react/tooltip'
import type { TooltipChangeDetails, TooltipPlacement } from '@ggary/core/tooltip'
import type { Dict } from '@ggary/core'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'

export interface TooltipProps {
  /** What the tooltip says. Text, not controls: something interactive belongs in a Popover. */
  content: ReactNode
  /** The described element: spread the props onto it. */
  trigger: (props: Dict) => ReactNode
  placement?: TooltipPlacement
  openDelay?: number
  closeDelay?: number
  disabled?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: TooltipChangeDetails) => void
}

const part = (name: string) => ({ 'data-scope': 'tooltip', 'data-part': name, 'data-backend': 'base-ui' })
export function Tooltip({ content, trigger, placement = 'top', openDelay = 500, closeDelay = 150,
  disabled = false, open, defaultOpen = false, onOpenChange }: TooltipProps) {
  const id = `gg-base-tooltip-${useId().replace(/:/g, '')}`
  const reference = useRef<HTMLButtonElement>(null)
  const [local, setLocal] = useState(defaultOpen)
  const shown = open ?? local
  const environment = useOverlayEnvironment(reference, shown)
  const [side, align] = placement.split('-')
  return <Primitive.Root open={shown} disabled={disabled} triggerId={`${id}-trigger`} onOpenChange={(next, details) => {
    if (open === undefined) setLocal(next)
    const reason: TooltipChangeDetails['reason'] = details.reason === 'trigger-hover' ? 'pointer'
      : details.reason === 'trigger-focus' ? 'focus' : details.reason === 'escape-key' ? 'escape'
      : details.reason === 'trigger-press' || details.reason === 'outside-press' ? 'press' : 'api'
    onOpenChange?.(next, { reason })
  }}>
    <Primitive.Trigger ref={reference} id={`${id}-trigger`} delay={openDelay} closeDelay={closeDelay}
      render={p => trigger({ ...p, 'aria-describedby': `${id}-content` }) as ReactElement} />
    <Primitive.Portal keepMounted container={environment.container}>
      <Primitive.Positioner {...part('positioner')} positionMethod="fixed" side={side as 'top' | 'bottom' | 'left' | 'right'}
        align={(align ?? 'center') as 'start' | 'center' | 'end'} sideOffset={6}
        data-mode={environment.mode} dir={environment.dir} lang={environment.locale} style={environment.style}>
        <Primitive.Popup {...part('content')} role="tooltip" id={`${id}-content`} data-state={shown ? 'open' : 'closed'}>{content}</Primitive.Popup>
      </Primitive.Positioner>
    </Primitive.Portal>
  </Primitive.Root>
}
