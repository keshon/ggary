import { useId, type ReactNode } from 'react'
import { Accordion as Primitive } from '@base-ui/react/accordion'
import type { AccordionItem } from '@ggary/core/accordion'

export interface AccordionProps {
  items: AccordionItem[]
  /** The section under an item. */
  children: (item: AccordionItem) => ReactNode
  /** Controlled: the open sections. Omit and use `defaultValue` for uncontrolled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Several sections may stand open. Default false. */
  multiple?: boolean
  /** The open section may be closed, leaving none. Default true. */
  collapsible?: boolean
  disabled?: boolean
  /** The heading level of each section's button. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** Keep a closed section's content in the page, hidden. Default true: find-in-page searches it. */
  keepMounted?: boolean
}

const part = (name: string) => ({ 'data-scope': 'accordion', 'data-part': name, 'data-backend': 'base-ui' })

/** Base UI owns disclosure, focus semantics and find-in-page expansion. */
export function Accordion(props: AccordionProps) {
  const { items, children, value, defaultValue, onValueChange, multiple = false,
    collapsible = true, disabled, headingLevel = 3, keepMounted = true } = props
  const id = useId()
  const itemId = (value: string) => `${id}-${encodeURIComponent(value)}`
  return <Primitive.Root<string> {...part('root')} value={value} defaultValue={defaultValue}
    disabled={disabled} multiple={multiple} hiddenUntilFound={keepMounted}
    onValueChange={(next, details) => {
      if (!multiple && !collapsible && next.length === 0) { details.cancel(); return }
      onValueChange?.(next)
    }}>
    {items.map((item) => <Primitive.Item key={item.value} {...part('item')} value={item.value} disabled={item.disabled}
      render={(itemProps, state) => <div {...itemProps} data-value={item.value} data-state={state.open ? 'open' : 'closed'} />}>
      <Primitive.Header {...part('heading')} render={<div {...part('heading')} role="heading" aria-level={headingLevel} />}>
        <Primitive.Trigger {...part('trigger')}
          id={`${itemId(item.value)}-trigger`} aria-controls={`${itemId(item.value)}-panel`} aria-labelledby={`${itemId(item.value)}-label`}
          aria-describedby={item.description ? `${itemId(item.value)}-description` : undefined}
          render={(triggerProps, state) => <button {...triggerProps}
            aria-disabled={state.disabled || (state.open && !multiple && !collapsible) ? true : undefined}
            data-state={state.open ? 'open' : 'closed'}>
            <span {...part('label')} id={`${itemId(item.value)}-label`}>{item.label}</span>
            {item.description && <span {...part('description')} id={`${itemId(item.value)}-description`}>{item.description}</span>}
            <span {...part('indicator')} data-icon="chevron-down" aria-hidden="true" data-state={state.open ? 'open' : 'closed'} />
          </button>} />
      </Primitive.Header>
      <Primitive.Panel {...part('content')} id={`${itemId(item.value)}-panel`} keepMounted={keepMounted}
        aria-labelledby={items.length <= 6 ? `${itemId(item.value)}-trigger` : undefined}
        render={(panelProps, state) => <div {...panelProps} role={items.length <= 6 ? 'region' : undefined} data-state={state.open ? 'open' : 'closed'} />}>
        <div {...part('body')}>{children(item)}</div>
      </Primitive.Panel>
    </Primitive.Item>)}
  </Primitive.Root>
}
