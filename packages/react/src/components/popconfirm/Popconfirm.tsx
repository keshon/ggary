import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createPopconfirmMachine, type PopconfirmChangeDetails, type PopconfirmWords } from '@ggary/core/popconfirm'
import { attachPopover, reactNormalizer, type AttachedPopover, type Dict, type Placement } from '@ggary/core'
import { Button } from '../button'
import { useConfigured } from '../config-provider'

export interface PopconfirmProps {
  /** The question: "Delete this lead?" */
  title: ReactNode
  /** What follows if the answer is yes: "Its history goes with it." */
  description?: ReactNode
  /** The action destroys: its answer is drawn so, and the focus lands on Cancel. */
  destructive?: boolean
  /** The action's answer, named for the action: "Delete". Default "Confirm". */
  confirmLabel?: string
  cancelLabel?: string
  /** The action. A promise keeps the question open, busy, until it settles; a rejection's message is shown. */
  onConfirm?: () => unknown
  /** It closed any way but by the action. */
  onCancel?: () => void
  onOpenChange?: (open: boolean, details: PopconfirmChangeDetails) => void
  /** The opener: spread the props onto a Button. */
  trigger: (props: Dict) => ReactNode
  placement?: Placement
  words?: Pick<PopconfirmWords, 'failed'>
}

export function Popconfirm(props: PopconfirmProps) {
  props = useConfigured(props, { words: 'popconfirm' })
  const { title, description, destructive = false, confirmLabel, cancelLabel, onConfirm, onCancel, onOpenChange, trigger, placement, words } = props
  const id = `gg-popconfirm-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onConfirm, onCancel, onOpenChange })
  callbacks.current = { onConfirm, onCancel, onOpenChange }

  const [machine] = useState(() =>
    createPopconfirmMachine({
      id,
      placement,
      onConfirm: () => callbacks.current.onConfirm?.(),
      onCancel: () => callbacks.current.onCancel?.(),
      onOpenChange: (open, details) => callbacks.current.onOpenChange?.(open, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, {
    destructive,
    description: description != null,
    words: { confirm: confirmLabel, cancel: cancelLabel, failed: words?.failed },
  })

  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', placement }), [machine, placement])

  const contentRef = useRef<HTMLDivElement>(null)
  const attached = useRef<AttachedPopover | null>(null)
  useLayoutEffect(() => {
    const content = contentRef.current
    const reference = document.getElementById(api.ids.trigger)
    if (!state.open || !content || !reference) return
    const instance = attachPopover(reference, content, {
      placement: machine.getState().placement,
      gutter: 6,
      manageFocus: true,
      onDismiss: (reason) => api.dismiss(reason),
    })
    attached.current = instance
    return () => {
      instance.destroy()
      attached.current = null
    }
  }, [machine, state.open])
  useLayoutEffect(() => {
    attached.current?.update({ placement: state.placement })
  }, [state.placement])

  return (
    <>
      {trigger(api.triggerProps)}
      <div ref={contentRef} {...api.contentProps}>
        {state.open && (
          <>
            <p {...api.titleProps}>{title}</p>
            {description != null && <p {...api.descriptionProps}>{description}</p>}
            {api.failed && <p {...api.errorProps}>{api.errorText}</p>}
            <div {...api.actionsProps}>
              <Button size="sm" emphasis="medium" {...api.cancelProps}>
                {api.cancelText}
              </Button>
              <Button size="sm" emphasis="high" destructive={api.destructive} loading={api.pending} {...api.confirmProps}>
                {api.confirmText}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
