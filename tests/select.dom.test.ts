import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SelectItem } from '../packages/core/src/components/select/select.types'

/**
 * Floating UI measures real layout. jsdom reports every rect as 0x0 at 0,0, so
 * flip/shift/size churn against degenerate input and the suite crawls. Where an
 * element ends up on screen is a visual concern — verify it in Playwright, and
 * keep this suite about the DOM contract.
 */
vi.mock('@ggary/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ggary/core')>()),
  attachPositioner: () => () => {},
}))

/**
 * Conformance, run against ONE renderer (the custom element). The machine tests
 * already cover behaviour; this suite exists to prove the DOM contract the CSS
 * and screen readers depend on — data-part, ARIA wiring, keyboard routing.
 *
 * The same assertions should eventually run against the React and Svelte
 * adapters too; that is the third test matrix you have to budget for.
 */

const items: SelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie', disabled: true },
  { value: 'd', label: 'Delta' },
]

let host: HTMLElement & { items: SelectItem[]; value: string | null }

beforeAll(async () => {
  await import('../packages/elements/src/index')
})

beforeEach(async () => {
  document.body.innerHTML = '<gg-select id="s" label="Framework" placeholder="Pick one"></gg-select>'
  host = document.getElementById('s') as typeof host
  host.items = items
})

const part = (name: string) => document.querySelector(`[data-scope="select"][data-part="${name}"]`)!
const trigger = () => part('trigger') as HTMLButtonElement
const options = () => [...document.querySelectorAll('[data-part="item"]')] as HTMLElement[]
const key = (k: string, init: KeyboardEventInit = {}) =>
  trigger().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }))

describe('anatomy', () => {
  it('renders every part the stylesheet targets', () => {
    for (const name of ['root', 'label', 'trigger', 'value', 'indicator', 'positioner', 'content']) {
      expect(part(name), `missing [data-part="${name}"]`).toBeTruthy()
    }
    expect(options()).toHaveLength(items.length)
  })

  // Regression: the vanilla renderer looped over items and so rendered nothing at
  // all for an empty list, while React and Svelte both rendered [data-part="empty"].
  // Adapter drift is the standing risk of this architecture; this is the suite
  // that is supposed to catch it.
  it('renders the empty part when there are no items', () => {
    host.items = []
    expect(part('empty')).toBeTruthy()
    expect(options()).toHaveLength(0)

    host.items = items
    expect(document.querySelector('[data-part="empty"]')).toBeNull()
    expect(options()).toHaveLength(items.length)
  })

  it('exposes state as data attributes, not class names', () => {
    expect(document.querySelector('[class]')).toBeNull()
    expect(trigger().dataset.state).toBe('closed')
  })
})

describe('aria wiring', () => {
  it('uses the select-only combobox pattern', () => {
    expect(trigger().getAttribute('role')).toBe('combobox')
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger().getAttribute('aria-expanded')).toBe('false')
    expect(trigger().getAttribute('aria-controls')).toBe(part('content').id)
    expect(part('content').getAttribute('role')).toBe('listbox')
  })

  it('points aria-activedescendant at the highlighted option while open', () => {
    trigger().click()
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    expect(trigger().getAttribute('aria-activedescendant')).toBe(options()[0].id)
    key('ArrowDown')
    expect(trigger().getAttribute('aria-activedescendant')).toBe(options()[1].id)
  })

  it('marks options with aria-selected and aria-disabled', () => {
    trigger().click()
    options()[1].click()
    expect(options()[1].getAttribute('aria-selected')).toBe('true')
    expect(options()[0].getAttribute('aria-selected')).toBe('false')
    expect(options()[2].getAttribute('aria-disabled')).toBe('true')
  })
})

describe('keyboard', () => {
  it('opens on Enter and selects on Enter', () => {
    key('Enter')
    expect(trigger().dataset.state).toBe('open')
    key('ArrowDown')
    key('Enter')
    expect(trigger().dataset.state).toBe('closed')
    expect(host.value).toBe('b')
  })

  it('closes on Escape without changing the value', () => {
    key('Enter')
    key('ArrowDown')
    key('Escape')
    expect(trigger().dataset.state).toBe('closed')
    expect(host.value).toBeNull()
  })

  it('skips disabled options', () => {
    key('Enter')
    key('End')
    expect(trigger().getAttribute('aria-activedescendant')).toBe(options()[3].id)
    key('ArrowUp')
    expect(trigger().getAttribute('aria-activedescendant')).toBe(options()[1].id)
  })

  it('removes data-highlighted from the option it leaves', () => {
    key('Enter')
    expect(options()[0].hasAttribute('data-highlighted')).toBe(true)
    key('ArrowDown')
    expect(options()[0].hasAttribute('data-highlighted')).toBe(false)
    expect(options()[1].hasAttribute('data-highlighted')).toBe(true)
  })
})

describe('form participation', () => {
  it('submits through a hidden input when named', () => {
    document.body.innerHTML = '<form><gg-select id="f" name="framework"></gg-select></form>'
    const el = document.getElementById('f') as typeof host
    el.items = items
    el.value = 'd'
    const data = new FormData(document.querySelector('form')!)
    expect(data.get('framework')).toBe('d')
  })
})

describe('events', () => {
  it('emits valuechange with the resolved item', () => {
    const seen: unknown[] = []
    host.addEventListener('valuechange', (event) => seen.push((event as CustomEvent).detail))
    trigger().click()
    options()[3].click()
    expect(seen).toEqual([{ value: 'd', item: items[3] }])
  })
})
