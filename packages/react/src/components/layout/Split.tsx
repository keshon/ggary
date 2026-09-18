import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'
import { connect, createSplitMachine, type SplitOptions } from '@ggary/core/split'
import { reactNormalizer } from '@ggary/core'

export interface SplitProps extends Partial<SplitOptions>, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The separator's name, required: "Resize the lead list". */
  label: string
  /** The two panes, in reading order. */
  children: [ReactNode, ReactNode]
  /** The primary pane's starting size in px — a stored one. Defaults to `defaultSize`. */
  size?: number
  collapsed?: boolean
  /** The least the other pane keeps, in px. Default 200. */
  restMin?: number
  /** Every change of size or fold, to keep the layout. */
  onSizeChange?: (size: number, details: { collapsed: boolean }) => void
}

/** Two panes and a separator that can be dragged, or moved from the keyboard. */
export function Split(props: SplitProps) {
  const {
    label, children, size, collapsed, restMin, onSizeChange, style,
    orientation, primary, min, max, step, collapsible, defaultSize, ...rest
  } = props
  const id = `gg-split-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onSizeChange })
  callbacks.current = { onSizeChange }

  const [machine] = useState(() =>
    createSplitMachine({
      id, size, collapsed, orientation, primary, min, max, step, collapsible, defaultSize,
      onSizeChange: (next, details) => callbacks.current.onSizeChange?.(next, details),
    })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { label, restMin })

  useEffect(
    () => machine.send({ type: 'SYNC_OPTIONS', orientation, primary, min, max, step, collapsible, defaultSize }),
    [machine, orientation, primary, min, max, step, collapsible, defaultSize]
  )

  const [first, second] = children
  return (
    <div {...rest} {...api.rootProps} style={{ ...(api.rootProps.style as CSSProperties | undefined), ...style }}>
      <div {...api.startPaneProps}>{first}</div>
      <div {...api.separatorProps}>
        <span {...api.handleProps} />
      </div>
      <div {...api.endPaneProps}>{second}</div>
    </div>
  )
}
