import type { DomProps } from '@ggary/core'

interface Applied {
  attrs: Set<string>
  /** Style properties set, one by one, so the author's own inline style stays. */
  styles: Set<string>
  listeners: Map<string, EventListener>
}

/** "a: 1; --b: 2px" as pairs. Values here are core's: no `;` inside one. */
const declarations = (text: string) =>
  text
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const colon = declaration.indexOf(':')
      return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()] as const
    })

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
    previous = { attrs: new Set(), styles: new Set(), listeners: new Map() }
    owners.set(owner, previous)
  }

  for (const name of previous.attrs) {
    if (!(name in props.attrs) && name !== 'style') element.removeAttribute(name)
  }
  for (const [name, value] of Object.entries(props.attrs)) {
    if (name === 'style') continue
    if (element.getAttribute(name) !== value) element.setAttribute(name, value)
  }
  previous.attrs = new Set(Object.keys(props.attrs))

  // Style is set property by property, not as the attribute: the attribute
  // would wipe whatever the page wrote on the host itself — a height, a width.
  const style = (element as HTMLElement).style
  if (style) {
    const next = declarations(props.attrs.style ?? '')
    const names = new Set(next.map(([name]) => name))
    for (const name of previous.styles) if (!names.has(name)) style.removeProperty(name)
    for (const [name, value] of next) if (style.getPropertyValue(name) !== value) style.setProperty(name, value)
    previous.styles = names
  }

  // Handlers are recreated on every connect() call, so swap rather than compare.
  // A name ending in "capture" (onInvalidCapture -> "invalidcapture") listens in
  // the capture phase, as React's and Svelte's capture handlers do: `invalid`
  // does not bubble, and a group hears its controls' only by capturing.
  const listen = (name: string) =>
    name.endsWith('capture') ? ([name.slice(0, -'capture'.length), true] as const) : ([name, false] as const)
  for (const [name, listener] of previous.listeners) {
    const [type, capture] = listen(name)
    element.removeEventListener(type, listener, capture)
  }
  previous.listeners.clear()
  for (const [name, listener] of Object.entries(props.listeners)) {
    const [type, capture] = listen(name)
    element.addEventListener(type, listener as EventListener, capture)
    previous.listeners.set(name, listener as EventListener)
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

/**
 * Make `parent`'s children exactly `children`, in order, moving only what is out
 * of place. Nodes that stay are never detached: detaching the focused element,
 * even to put it straight back, drops focus to <body> — which is what a tab
 * list rebuilt with replaceChildren did when a tab next to the focused one closed.
 */
export function reconcileChildren(parent: Element, children: Element[]): void {
  // Leavers first, so a removal in the middle does not make the nodes after it look out of place.
  const keep = new Set(children)
  for (const child of [...parent.children]) if (!keep.has(child)) child.remove()
  children.forEach((child, index) => {
    const current = parent.children[index]
    if (current !== child) parent.insertBefore(child, current ?? null)
  })
}
