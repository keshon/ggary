import { useEffect, useId, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import {
  connect,
  createShellMachine,
  type ShellChangeDetails,
  type ShellCollapse,
  type ShellConnectOptions,
} from '@ggary/core/shell'
import { attachShellDrawer, reactNormalizer } from '@ggary/core'

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

  const rootRef = useRef<HTMLDivElement>(null)
  const asideRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!api.open || !rootRef.current || !asideRef.current) return
    return attachShellDrawer(rootRef.current, asideRef.current, toggleRef.current, {
      onDismiss: (reason) => machine.send({ type: 'CLOSE', reason }),
    })
  }, [api.open, machine])

  const column = brand != null || aside != null
  return (
    <div ref={rootRef} {...rest} {...api.rootProps}>
      <a {...api.skipLinkProps}>{api.skipLabel}</a>
      {column && (
        <div ref={asideRef} {...api.asideProps}>
          {brand != null && <div {...api.brandProps}>{brand}</div>}
          {aside}
        </div>
      )}
      <header {...api.headerProps}>
        {column && (
          <button ref={toggleRef} {...api.toggleProps}>
            <span {...api.toggleIconProps} />
          </button>
        )}
        {header}
      </header>
      <main {...api.mainProps}>{children}</main>
      {footer != null && <footer {...api.footerProps}>{footer}</footer>}
    </div>
  )
}
