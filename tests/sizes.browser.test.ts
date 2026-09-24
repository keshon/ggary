import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ComponentType } from 'react'
import { flushSync as flushReact } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { flushSync, mount as mountSvelte, unmount as unmountSvelte, type Component } from 'svelte'
import * as React from '../packages/react/src/index'
import * as Svelte from '../packages/svelte/src/index'

/**
 * One size, one height: a small Select, Input and Button stand in one row
 * without a pixel between their edges. Measured in both adapters, at each of
 * the three sizes.
 */

const HEIGHT = { sm: 28, md: 34, lg: 40 } as const
type Size = keyof typeof HEIGHT

const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]
const tree = [{ value: 'a', label: 'Alpha', children: [{ value: 'a1', label: 'One' }] }]

/** The part whose box is the control's, per component, and the props it needs. */
const CASES: [name: string, part: string, props: Record<string, unknown>][] = [
  ['Button', "[data-scope='button'][data-part='root']", { children: 'Save' }],
  ['Input', "[data-scope='input'][data-part='root']", { 'aria-label': 'Name' }],
  ['NumberField', "[data-scope='number-field'][data-part='root']", { 'aria-label': 'Count', defaultValue: 1 }],
  ['Select', "[data-scope='select'][data-part='trigger']", { label: 'Pick', items }],
  ['Combobox', "[data-scope='combobox'][data-part='control']", { label: 'Find', items }],
  ['Cascader', "[data-scope='cascader'][data-part='trigger']", { label: 'Place', items: tree }],
  ['DatePicker', "[data-scope='date-picker'][data-part='control']", { label: 'When' }],
]

let cleanups: (() => void)[] = []
afterEach(() => {
  for (const clean of cleanups) clean()
  cleanups = []
  document.body.replaceChildren()
})

function mountReact(name: string, props: Record<string, unknown>) {
  const host = document.body.appendChild(document.createElement('div'))
  const root: Root = createRoot(host)
  const { children, ...rest } = props
  flushReact(() => root.render(h((React as unknown as Record<string, ComponentType<object>>)[name], rest, children as never)))
  cleanups.push(() => root.unmount())
  return host
}

function mountSvelteCase(name: string, props: Record<string, unknown>) {
  const host = document.body.appendChild(document.createElement('div'))
  const { children, ...rest } = props
  // Svelte's Button takes its label as a snippet; the height does not depend on it.
  const instance = mountSvelte((Svelte as unknown as Record<string, Component<object>>)[name], { target: host, props: rest })
  flushSync()
  cleanups.push(() => void unmountSvelte(instance))
  void children
  return host
}

describe.each([
  ['react', mountReact],
  ['svelte', mountSvelteCase],
] as const)('%s', (_, mount) => {
  it.each(Object.keys(HEIGHT) as Size[])('every control at %s is one height', (size) => {
    const heights = CASES.map(([name, part, props]) => {
      const host = mount(name, { ...props, size })
      const box = host.querySelector(part)
      return [name, box ? Math.round(box.getBoundingClientRect().height) : null]
    })
    expect(Object.fromEntries(heights)).toEqual(Object.fromEntries(CASES.map(([name]) => [name, HEIGHT[size]])))
  })
})
