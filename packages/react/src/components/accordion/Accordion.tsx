import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { connect, createAccordionMachine, findableContent, type AccordionItem } from '@ggary/core/accordion'
import { reactNormalizer, rovingFocus } from '@ggary/core'

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

/** Headings that show and hide the section under each. */
export function Accordion(props: AccordionProps) {
  const { items, children, value, defaultValue, onValueChange, multiple, collapsible, disabled, headingLevel, keepMounted = true } = props
  const id = `gg-accordion-${useId().replace(/:/g, '')}`
  const callbacks = useRef({ onValueChange })
  callbacks.current = { onValueChange }
  const [machine] = useState(() =>
    createAccordionMachine({ id, items, value, defaultValue, multiple, collapsible, disabled, onValueChange: (next) => callbacks.current.onValueChange?.(next) })
  )
  const state = useSyncExternalStore(machine.subscribe, machine.getState, machine.getState)
  const api = connect(state, machine.send, reactNormalizer, { headingLevel })

  useEffect(() => machine.send({ type: 'SYNC_ITEMS', items }), [machine, items])
  useEffect(() => machine.send({ type: 'SYNC_OPTIONS', multiple, collapsible, disabled }), [machine, multiple, collapsible, disabled])
  useEffect(() => {
    if (value !== undefined) machine.send({ type: 'SYNC_VALUE', value })
  }, [machine, value])

  const lastFocusNonce = useRef(0)
  useLayoutEffect(() => {
    if (api.focusNonce === 0 || api.focusNonce === lastFocusNonce.current || api.focusValue === null) return
    lastFocusNonce.current = api.focusNonce
    rovingFocus(document, api.ids.trigger(api.focusValue))
  })

  // A closed section stays findable: the browser's find-in-page opens it.
  const contents = useRef(new Map<string, HTMLElement>())
  useLayoutEffect(() => {
    const cleanups = items.map((item) => findableContent(contents.current.get(item.value) ?? null, api.isOpen(item.value), () => api.reveal(item.value)))
    return () => cleanups.forEach((cleanup) => cleanup())
  })

  return (
    <div {...api.rootProps}>
      {api.items.map((item) => {
        const open = api.isOpen(item.value)
        return (
          <div key={item.value} {...api.getItemProps(item)}>
            <div {...api.headingProps}>
              <button {...api.getTriggerProps(item)}>
                <span {...api.getLabelProps(item)}>{item.label}</span>
                {item.description && <span {...api.getDescriptionProps(item)}>{item.description}</span>}
                <span {...api.getIndicatorProps(item)} />
              </button>
            </div>
            <div
              ref={(element) => {
                if (element) contents.current.set(item.value, element)
                else contents.current.delete(item.value)
              }}
              {...api.getContentProps(item)}
            >
              {(open || keepMounted) && <div {...api.bodyProps}>{children(item)}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
