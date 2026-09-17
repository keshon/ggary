import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  connect,
  createDialogMachine,
  type DialogChangeDetails,
  type DialogPlacement,
  type DialogRole,
  type DialogSize,
} from '@ggary/core/dialog'
import { attachDialog, reactNormalizer, type AttachedDialog, type Dict } from '@ggary/core'

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

export function Dialog(props: DialogProps) {
  const {
    open, defaultOpen, onOpenChange, title, description, children, footer, trigger, size, placement,
    modal, role, closeOnEscape, closeOnOutside, closeButton = true, closeLabel,
  } = props

  const id = `gg-dialog-${useId().replace(/:/g, '')}`

  const callbacks = useRef({ onOpenChange })
  callbacks.current = { onOpenChange }

  const [machine] = useState(() =>
    createDialogMachine({
      id, open, defaultOpen, modal, role, closeOnEscape, closeOnOutside,
      onOpenChange: (next, details) => callbacks.current.onOpenChange?.(next, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, {
    title: title != null,
    description: description != null,
    size,
    placement,
    closeLabel,
  })

  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', modal, role, closeOnEscape, closeOnOutside }),
    [machine, modal, role, closeOnEscape, closeOnOutside]
  )

  const contentRef = useRef<HTMLDialogElement>(null)
  const attached = useRef<AttachedDialog | null>(null)

  // A layout effect: the body has just been committed, so showModal() finds
  // something to focus, and the first paint is already the open dialog.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!state.open || !el) return
    const { modal, closeOnEscape, closeOnOutside } = machine.getState()
    const instance = attachDialog(el, {
      modal,
      closeOnEscape,
      closeOnOutside,
      onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
      onNativeClose: (returnValue) => machine.send({ type: 'CLOSE', reason: 'native', returnValue }),
      exclude: [document.getElementById(api.ids.trigger)],
      finalFocus: document.getElementById(api.ids.trigger),
    })
    attached.current = instance
    return () => {
      instance.destroy()
      attached.current = null
    }
  }, [machine, state.open])

  useLayoutEffect(() => {
    attached.current?.update({ modal: state.modal, closeOnEscape: state.closeOnEscape, closeOnOutside: state.closeOnOutside })
  }, [state.modal, state.closeOnEscape, state.closeOnOutside])

  return (
    <>
      {trigger?.(api.triggerProps)}
      <dialog ref={contentRef} {...api.contentProps}>
        {state.open && (
          <>
            {(title != null || closeButton) && (
              <header {...api.headerProps}>
                {title != null && <h2 {...api.titleProps}>{title}</h2>}
                {description != null && <p {...api.descriptionProps}>{description}</p>}
                {closeButton && (
                  <button {...api.closeProps}>
                    <span {...api.closeIconProps} />
                  </button>
                )}
              </header>
            )}
            <div {...api.bodyProps}>{children}</div>
            {footer != null && <footer {...api.footerProps}>{footer}</footer>}
          </>
        )}
      </dialog>
    </>
  )
}
