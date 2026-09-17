import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createTooltipMachine,
  type TooltipChangeDetails,
  type TooltipPlacement,
} from '@ggary/core/tooltip'
import { attachPopover, reactNormalizer, type Dict } from '@ggary/core'

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

export function Tooltip(props: TooltipProps) {
  const { content, trigger, placement, openDelay, closeDelay, disabled, open, defaultOpen, onOpenChange } = props

  const id = `gg-tooltip-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onOpenChange })
  callbacks.current = { onOpenChange }

  const [machine] = useState(() =>
    createTooltipMachine({
      id, open, defaultOpen, placement, openDelay, closeDelay, disabled,
      onOpenChange: (next, details) => callbacks.current.onOpenChange?.(next, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer)

  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', placement, openDelay, closeDelay, disabled }),
    [machine, placement, openDelay, closeDelay, disabled]
  )
  // A timer still pending when the tooltip goes away must not report to an owner that is gone.
  useEffect(() => () => machine.send({ type: 'DESTROY' }), [machine])

  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = contentRef.current
    const reference = el && document.querySelector<HTMLElement>(`[aria-describedby~="${api.ids.content}"]`)
    if (!state.open || !el || !reference) return
    const instance = attachPopover(reference, el, {
      placement: machine.getState().placement,
      gutter: 6,
      passive: true,
      closeOnOutside: false,
      onDismiss: () => machine.send({ type: 'ESCAPE' }),
    })
    return () => instance.destroy()
  }, [machine, state.open, state.placement])

  return (
    <>
      {trigger(api.triggerProps)}
      <div ref={contentRef} {...api.contentProps}>
        {content}
      </div>
    </>
  )
}
