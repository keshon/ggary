import type { DomProps } from '@ggary/core'

interface Applied {
  attrs: Set<string>
  listeners: Map<string, EventListener>
}

const applied = new WeakMap<Element, Map<string, Applied>>()

/**
 * The vanilla equivalent of JSX spread: apply a normalized prop bag to a real
 * element, diffing against whatever was applied last time so attributes that
 * disappeared (`data-highlighted`) actually get removed.
 *
 * This is the whole "renderer" for the elements package.
 */
export function spread(element: Element, props: DomProps, owner = 'self'): void {
  // Bookkeeping is per owner. One element can take props from two elements —
  // a <button> that <gg-button> styles and <gg-dialog> uses as its trigger —
  // and each may only remove what it applied itself, or they would strip each
  // other's attributes and listeners on every render.
  let owners = applied.get(element)
  if (!owners) {
    owners = new Map()
    applied.set(element, owners)
  }
  let previous = owners.get(owner)
  if (!previous) {
    previous = { attrs: new Set(), listeners: new Map() }
    owners.set(owner, previous)
  }

  for (const name of previous.attrs) {
    if (!(name in props.attrs)) element.removeAttribute(name)
  }
  for (const [name, value] of Object.entries(props.attrs)) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value)
  }
  previous.attrs = new Set(Object.keys(props.attrs))

  // Handlers are recreated on every connect() call, so swap rather than compare.
  for (const [type, listener] of previous.listeners) element.removeEventListener(type, listener)
  previous.listeners.clear()
  for (const [type, listener] of Object.entries(props.listeners)) {
    element.addEventListener(type, listener as EventListener)
    previous.listeners.set(type, listener as EventListener)
  }
}

/** Create an element with an initial prop bag applied. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: DomProps,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  if (props) spread(element, props)
  if (children) element.append(...children)
  return element
}
