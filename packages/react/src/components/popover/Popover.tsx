import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createPopoverMachine,
  type PopoverChangeDetails,
  type PopoverPlacement,
} from '@ggary/core/popover'
import { attachPopover, reactNormalizer, type AttachedPopover, type Dict } from '@ggary/core'

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

export function Popover(props: PopoverProps) {
  const {
    open, defaultOpen, onOpenChange, trigger, title, children, placement, closeOnEscape, closeOnOutside,
    closeButton = false, closeLabel,
  } = props

  const id = `gg-popover-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onOpenChange })
  callbacks.current = { onOpenChange }

  const [machine] = useState(() =>
    createPopoverMachine({
      id, open, defaultOpen, placement, closeOnEscape, closeOnOutside,
      onOpenChange: (next, details) => callbacks.current.onOpenChange?.(next, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { title: title != null, closeLabel })

  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', placement, closeOnEscape, closeOnOutside }),
    [machine, placement, closeOnEscape, closeOnOutside]
  )

  const contentRef = useRef<HTMLDivElement>(null)
  const attached = useRef<AttachedPopover | null>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    const reference = document.getElementById(api.ids.trigger)
    if (!state.open || !content || !reference) return
    const { placement, closeOnEscape, closeOnOutside } = machine.getState()
    const instance = attachPopover(reference, content, {
      placement,
      gutter: 6,
      closeOnEscape,
      closeOnOutside,
      manageFocus: true,
      onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
    })
    attached.current = instance
    return () => {
      instance.destroy()
      attached.current = null
    }
  }, [machine, state.open])

  useLayoutEffect(() => {
    attached.current?.update({ placement: state.placement, closeOnEscape: state.closeOnEscape, closeOnOutside: state.closeOnOutside })
  }, [state.placement, state.closeOnEscape, state.closeOnOutside])

  return (
    <>
      {trigger(api.triggerProps)}
      <div ref={contentRef} {...api.contentProps}>
        {state.open && (
          <>
            {title != null && <h2 {...api.titleProps}>{title}</h2>}
            {closeButton && (
              <button {...api.closeProps}>
                <span {...api.closeIconProps} />
              </button>
            )}
            {children}
          </>
        )}
      </div>
    </>
  )
}
