import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Tabs as Primitive } from '@base-ui/react/tabs'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import type { TabItem, TabsActivation, TabsOrientation, TabsVariant } from '@ggary/core/tabs'
import type { ControlSize } from '@ggary/core'
import { useConfigured, useConfig } from '../config-provider'

export interface TabsProps {
  /** `sm`, `md` or `lg`, as Input's and Button's. Default `md`. */
  size?: ControlSize
  items: TabItem[]
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** A close button, Delete or a middle click on a closable tab. Remove the item to close it. */
  onClose?: (value: string) => void
  /** The tab list's accessible name. */
  label?: string
  orientation?: TabsOrientation
  activation?: TabsActivation
  /** `sections` for views of one thing, `documents` for open, closable items. Default `sections`. */
  variant?: TabsVariant
  /** The panel for a tab. Omit it for tabs that switch something rendered elsewhere. */
  children?: (item: TabItem) => ReactNode
  /** Render every panel, hidden, rather than the selected one alone. Keeps their state. */
  keepMounted?: boolean
  closeLabel?: (label: string) => string
}

const part = (name: string) => ({ 'data-scope': 'tabs', 'data-part': name, 'data-backend': 'base-ui' })

export function Tabs(props: TabsProps) {
  props = useConfigured(props, { size: true })
  const { items, value, defaultValue, onValueChange, onClose, label,
    orientation = 'horizontal', activation = 'automatic', variant = 'sections',
    size = 'md', children, keepMounted = false, closeLabel = (text: string) => `Close ${text}` } = props
  const config = useConfig()
  const refs = useRef(new Map<string, HTMLElement>())
  const pendingClose = useRef<{ value: string; next?: string } | null>(null)
  useLayoutEffect(() => {
    const pending = pendingClose.current
    if (pending && !items.some((item) => item.value === pending.value)) {
      pendingClose.current = null
      if (pending.next) refs.current.get(pending.next)?.focus()
    }
  }, [items])
  const close = (item: TabItem) => {
    if (item.disabled || !item.closable) return
    // Document closing is a GGary feature. Base UI owns ordinary tab navigation.
    if (document.activeElement === refs.current.get(item.value)) {
      const index = items.indexOf(item)
      const next = items.slice(index + 1).find((candidate) => !candidate.disabled)
        ?? items.slice(0, index).reverse().find((candidate) => !candidate.disabled)
      pendingClose.current = { value: item.value, next: next?.value }
    }
    onClose?.(item.value)
  }
  return <DirectionProvider direction={config.dir ?? 'ltr'}>
    <Primitive.Root {...part('root')} value={value} defaultValue={defaultValue}
      orientation={orientation} data-size={size} data-variant={variant}
      onValueChange={(next, details) => { if (typeof next === 'string' && details.reason !== 'initial') onValueChange?.(next) }}>
      <Primitive.List {...part('list')} aria-label={label} data-variant={variant} activateOnFocus={activation === 'automatic'}>
        {items.map((item) => <Primitive.Tab key={item.value} {...part('tab')} value={item.value}
          disabled={item.disabled} nativeButton={false} render={(tabProps, state) => <div {...tabProps} data-state={state.active ? 'active' : 'inactive'} />}
          ref={(element) => { if (element) refs.current.set(item.value, element); else refs.current.delete(item.value) }}
          data-value={item.value} data-closable={item.closable ? '' : undefined} data-modified={item.modified ? '' : undefined}
          onKeyDown={(event) => { if (event.key === 'Delete' && item.closable && !item.disabled) { event.preventDefault(); close(item) } }}
          onAuxClick={(event) => { if (event.button === 1) { event.preventDefault(); close(item) } }}
        >
          <span {...part('tab-text')}>{item.label}</span>
          {item.closable && <button {...part('close')} type="button" tabIndex={-1} disabled={item.disabled}
            aria-label={closeLabel(item.label)} onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => { event.stopPropagation(); close(item) }}>
            <span {...part('close-icon')} data-icon="close" aria-hidden="true" />
          </button>}
        </Primitive.Tab>)}
      </Primitive.List>
      {children && items.map((item) => <Primitive.Panel key={item.value} {...part('panel')} value={item.value} keepMounted={keepMounted} data-value={item.value}
        render={(panelProps, state) => <div {...panelProps} data-state={state.hidden ? 'inactive' : 'active'} />}>
        {children(item)}
      </Primitive.Panel>)}
    </Primitive.Root>
  </DirectionProvider>
}
