import { afterEach, describe, expect, it } from 'vitest'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Cascader, Combobox, DatePicker, Field, NumberField, Select, TimePicker } from '../packages/react/src/index'
import { places } from './conformance/places'

let roots: Root[] = []
afterEach(() => {
  for (const root of roots) root.unmount()
  roots = []
  document.body.replaceChildren()
})

const choices = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }]
const controls = (fullWidth = false): ReactElement[] => [
  h(Select, { key: 'select', items: choices, defaultValue: 'a', fullWidth }),
  h(Combobox, { key: 'combobox', items: choices, defaultValue: 'a', fullWidth }),
  h(Cascader, { key: 'cascader', items: places, defaultValue: ['ru'], fullWidth }),
  h(DatePicker, { key: 'date', defaultValue: '2026-10-13', fullWidth }),
  h(TimePicker, { key: 'time', defaultValue: '12:30', fullWidth }),
  h(NumberField, { key: 'number', defaultValue: 42, fullWidth }),
]

function mount(nodes: ReactElement[], inlineSize: number) {
  const host = document.body.appendChild(document.createElement('div'))
  host.style.cssText = `inline-size:${inlineSize}px;display:flex;flex-direction:column;align-items:flex-start;gap:8px`
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(nodes))
  return host
}

const fieldRoots = (host: HTMLElement) => [...host.querySelectorAll<HTMLElement>(
  '[data-part="root"]:is([data-scope="select"],[data-scope="combobox"],[data-scope="cascader"],[data-scope="date-picker"],[data-scope="time-picker"],[data-scope="number-field"])'
)]

describe('field control width contract', () => {
  it('uses stable standalone widths instead of sizing from the current value', () => {
    const host = mount(controls(), 500)
    expect(fieldRoots(host).map(root => Math.round(root.getBoundingClientRect().width))).toEqual([240, 240, 240, 180, 180, 240])
  })

  it('shrinks every standalone field control inside a narrow owner', () => {
    const host = mount(controls(), 160)
    for (const root of fieldRoots(host)) expect(root.getBoundingClientRect().width, root.dataset.scope).toBeLessThanOrEqual(160)
  })

  it('fills the owner only when fullWidth is explicit', () => {
    const host = mount(controls(true), 420)
    for (const root of fieldRoots(host)) {
      expect(root.hasAttribute('data-full-width')).toBe(true)
      expect(root.getBoundingClientRect().width).toBeCloseTo(420, 0)
    }
  })

  it('lets Field composition own the row and reserves a wider stable range picker', () => {
    const fieldHost = mount([h(Field, { key: 'field', label: 'Stage', children: h(Select, { items: choices }) })], 420)
    fieldHost.style.alignItems = 'stretch'
    expect(fieldHost.querySelector<HTMLElement>('[data-scope="select"][data-part="root"]')!.getBoundingClientRect().width).toBeCloseTo(420, 0)

    const rangeHost = mount([h(DatePicker, { key: 'range', mode: 'range' })], 500)
    expect(rangeHost.querySelector<HTMLElement>('[data-scope="date-picker"][data-part="root"]')!.getBoundingClientRect().width).toBeCloseTo(280, 0)
  })
})
