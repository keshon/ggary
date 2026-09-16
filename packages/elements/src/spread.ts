import type { DomProps } from '@ggary/core'

interface Applied {
  attrs: Set<string>
  listeners: Map<string, EventListener>
}

const applied = new WeakMap<Element, Applied>()

/**
 * The vanilla equivalent of JSX spread: apply a normalized prop bag to a real
 * element, diffing against whatever was applied last time so attributes that
 * disappeared (`data-highlighted`) actually get removed.
 *
 * This is the whole "renderer" for the elements package.
 */
export function spread(element: Element, props: DomProps): void {
  let previous = applied.get(element)
  if (!previous) {
    previous = { attrs: new Set(), listeners: new Map() }
    applied.set(element, previous)
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

const SVG_NS = 'http://www.w3.org/2000/svg'

export function icon(path: string, props?: DomProps): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', '14')
  svg.setAttribute('height', '14')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('fill', 'none')
  const d = document.createElementNS(SVG_NS, 'path')
  d.setAttribute('d', path)
  d.setAttribute('stroke', 'currentColor')
  d.setAttribute('stroke-width', '1.75')
  d.setAttribute('stroke-linecap', 'round')
  d.setAttribute('stroke-linejoin', 'round')
  svg.append(d)
  if (props) spread(svg, props)
  return svg
}

export const CHEVRON = 'M4 6l4 4 4-4'
export const CHECK = 'M3.5 8.5l3 3 6-7'
