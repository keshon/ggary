import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactElement, type ReactNode } from 'react'
import { connect, createPopconfirmMachine, type PopconfirmChangeDetails, type PopconfirmWords } from '@ggary/core/popconfirm'
import { reactNormalizer, type Dict, type Placement } from '@ggary/core'
import { Popover as Primitive } from '@base-ui/react/popover'
import { useOverlayEnvironment } from '../../utils/use-overlay-environment'
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
  /** Opens with the page: the question already asked. */
  defaultOpen?: boolean
  /** The opener: spread the props onto a Button. */
  trigger: (props: Dict) => ReactNode
  placement?: Placement
  words?: Pick<PopconfirmWords, 'failed'>
}

export function Popconfirm(props: PopconfirmProps) {
  props = useConfigured(props, { words: 'popconfirm' })
  const { title, description, destructive = false, confirmLabel, cancelLabel, onConfirm, onCancel, onOpenChange, defaultOpen, trigger, placement, words } = props
  const id = `gg-popconfirm-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onConfirm, onCancel, onOpenChange })
  callbacks.current = { onConfirm, onCancel, onOpenChange }

  const [machine] = useState(() =>
    createPopconfirmMachine({
      id,
      placement,
      defaultOpen,
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

  const reference = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const environment = useOverlayEnvironment(reference, state.open)
  const [side, align] = state.placement.split('-')
  const { popover: _nativePopover, ...contentProps } = api.contentProps

  return (
    <Primitive.Root open={state.open} triggerId={api.ids.trigger} onOpenChange={(next, details) => {
      machine.send(next ? { type: 'OPEN', reason: 'trigger' } : { type: 'CLOSE',
        reason: details.reason === 'escape-key' ? 'escape' : details.reason === 'trigger-press' ? 'trigger' : 'outside' })
    }}>
      <Primitive.Trigger ref={reference} id={api.ids.trigger} render={p => trigger({ ...p,
        'aria-expanded': state.open ? 'true' : 'false' }) as ReactElement} />
      <Primitive.Portal keepMounted container={environment.container}>
        <Primitive.Positioner data-scope="popconfirm" data-part="positioner" data-backend="base-ui"
          positionMethod="fixed" side={side as 'top' | 'bottom' | 'left' | 'right'}
          align={(align ?? 'center') as 'start' | 'end' | 'center'} sideOffset={6}
          data-mode={environment.mode} dir={environment.dir} lang={environment.locale} style={environment.style}>
      <Primitive.Popup ref={contentRef} {...contentProps} data-backend="base-ui" finalFocus={reference}
        initialFocus={() => contentRef.current?.querySelector<HTMLElement>('[data-autofocus]') ?? false}>
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
      </Primitive.Popup>
        </Primitive.Positioner>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
