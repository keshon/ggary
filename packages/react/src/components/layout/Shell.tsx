import { Dialog as Primitive } from '@base-ui/react/dialog'
import { useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import {
  connect,
  SHELL_NARROW,
  createShellMachine,
  type ShellChangeDetails,
  type ShellCollapse,
  type ShellConnectOptions,
} from '@ggary/core/shell'
import { watchMedia, reactNormalizer } from '@ggary/core'

export interface ShellProps extends ShellConnectOptions, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The application's name at the top of the side column — a link home, usually. */
  brand?: ReactNode
  /** The side column: a Nav, a Rail. Without it the shell has no column and no drawer. */
  aside?: ReactNode
  /** The strip over the work area: breadcrumbs, a search, the account. */
  header?: ReactNode
  /** The status strip along the bottom. */
  footer?: ReactNode
  /** The work area: the page's `main`. */
  children: ReactNode
  /** What the column becomes on a narrow screen. Default `drawer`. */
  collapse?: ShellCollapse
  /** The drawer. Controlled; omit for uncontrolled. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, details: ShellChangeDetails) => void
}

export function Shell(props: ShellProps) {
  const {
    brand, aside, header, footer, children, collapse, open, defaultOpen, onOpenChange,
    skipLabel, toggleLabel, asideLabel, ...rest
  } = props
  const id = `gg-shell-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onOpenChange })
  callbacks.current = { onOpenChange }

  const [machine] = useState(() =>
    createShellMachine({ id, open, defaultOpen, collapse, onOpenChange: (next, details) => callbacks.current.onOpenChange?.(next, details) })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { skipLabel, toggleLabel, asideLabel })

  useEffect(() => {
    if (open !== undefined) machine.send({ type: 'SYNC_OPEN', open })
  }, [machine, open])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', collapse }), [machine, collapse])

  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [narrow, setNarrow] = useState(() => typeof window === 'undefined' ? false : (window.matchMedia?.(SHELL_NARROW).matches ?? true))
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => watchMedia(document, SHELL_NARROW, next => {
    setNarrow(next)
    if (!next && machine.getState().open) machine.send({ type: 'CLOSE', reason: 'resize' })
  }), [machine])

  const column = brand != null || aside != null
  const modal = column && api.drawer && narrow
  const { onClick: _toggle, ...toggleProps } = api.toggleProps
  return (
    <Primitive.Root open={modal ? api.open : true} modal={modal} disablePointerDismissal={!modal}
      onOpenChange={(next, details) => {
        if (!modal) { details.cancel(); return }
        machine.send(next ? { type: 'OPEN', reason: 'toggle' } : { type: 'CLOSE', reason:
          details.reason === 'escape-key' ? 'escape' : details.reason === 'trigger-press' ? 'toggle' : 'outside' })
      }}>
    <div ref={setHost} {...rest} {...api.rootProps}>
      <a {...api.skipLinkProps}>{api.skipLabel}</a>
      {column && host && (
        <Primitive.Portal container={host} keepMounted data-scope="shell" data-part="column" style={{ display: 'contents' }}>
        <Primitive.Popup {...api.asideProps} role={modal ? "dialog" : "complementary"} aria-label={asideLabel ?? "Navigation"} initialFocus={modal} finalFocus={modal ? toggleRef : false}>
          {brand != null && <div {...api.brandProps}>{brand}</div>}
          {aside}
        </Primitive.Popup>
        </Primitive.Portal>
      )}
      <header {...api.headerProps}>
        {column && (
          <Primitive.Trigger ref={toggleRef} {...toggleProps}>
            <span {...api.toggleIconProps} />
          </Primitive.Trigger>
        )}
        {header}
      </header>
      <main {...api.mainProps}>{children}</main>
      {footer != null && <footer {...api.footerProps}>{footer}</footer>}
    </div>
    </Primitive.Root>
  )
}
