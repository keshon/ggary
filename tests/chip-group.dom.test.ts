import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { ChipItem } from '../packages/core/src/components/chip-group/chip-group.types'

const items: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
  { value: 'docs', label: 'Docs', disabled: true },
  { value: 'devops', label: 'DevOps' },
]

let host: HTMLElement & { items: ChipItem[]; selection: string[] }

beforeAll(async () => {
  await import('../packages/elements/src/index')
})

beforeEach(() => {
  document.body.innerHTML = '<gg-chip-group id="g" label="Tags" mode="multi" removable></gg-chip-group>'
  host = document.getElementById('g') as typeof host
  host.items = items
})

const list = () => document.querySelector('[data-scope="chip-group"][data-part="list"]')!
const chips = () => [...list().querySelectorAll('[data-scope="chip"][data-part="root"]')] as HTMLButtonElement[]
const key = (target: HTMLElement, k: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

describe('anatomy', () => {
  it('renders chips under the chip scope, so chip.css styles them unchanged', () => {
    expect(chips()).toHaveLength(items.length)
    for (const chip of chips()) expect(chip.dataset.scope).toBe('chip')
    expect(list().getAttribute('role')).toBe('toolbar')
    expect(list().getAttribute('aria-orientation')).toBe('horizontal')
  })

  it('renders the empty part for an empty list', () => {
    host.items = []
    expect(document.querySelector('[data-part="empty"]')).toBeTruthy()
    expect(chips()).toHaveLength(0)
  })
})

describe('roving tabindex', () => {
  it('keeps exactly one chip in the tab order', () => {
    const tabbable = chips().filter((c) => c.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(chips()[0])
    expect(chips().slice(1).every((c) => c.tabIndex === -1)).toBe(true)
  })

  it('does not steal focus on mount', () => {
    expect(document.activeElement).not.toBe(chips()[0])
  })

  it('moves real DOM focus with the arrow keys, skipping disabled chips', () => {
    chips()[0].focus()
    key(chips()[0], 'ArrowRight')
    expect(document.activeElement).toBe(chips()[1])
    key(chips()[1], 'ArrowRight')
    expect(document.activeElement).toBe(chips()[3]) // 2 is disabled
  })

  it('wraps at both ends', () => {
    chips()[0].focus()
    key(chips()[0], 'ArrowLeft')
    expect(document.activeElement).toBe(chips()[3])
    key(chips()[3], 'ArrowRight')
    expect(document.activeElement).toBe(chips()[0])
  })

  // Regression: the focus effect originally ran on every render (its dep array
  // contained a freshly-built `ids` object), so any unrelated state change
  // dragged focus back into the group.
  it('does not drag focus back when it re-renders for an unrelated reason', () => {
    document.body.insertAdjacentHTML('beforeend', '<button id="outside">outside</button>')
    const outside = document.getElementById('outside')!

    chips()[0].focus()
    key(chips()[0], 'ArrowRight') // a real focus move, so the nonce is now > 0
    expect(document.activeElement).toBe(chips()[1])

    outside.focus()
    host.selection = ['design'] // unrelated state change -> full re-render
    expect(document.activeElement).toBe(outside)
  })

  it('follows aria-orientation for which arrows are live', () => {
    document.body.innerHTML = '<gg-chip-group id="v" orientation="vertical"></gg-chip-group>'
    const vertical = document.getElementById('v') as typeof host
    vertical.items = items
    const vchips = [...document.querySelectorAll('[data-scope="chip"][data-part="root"]')] as HTMLButtonElement[]
    vchips[0].focus()
    key(vchips[0], 'ArrowRight')
    expect(document.activeElement).toBe(vchips[0]) // horizontal arrows are inert
    key(vchips[0], 'ArrowDown')
    expect(document.activeElement).toBe(vchips[1])
  })
})

describe('selection', () => {
  it('exposes state through aria-pressed and data-selected', () => {
    chips()[0].click()
    expect(chips()[0].getAttribute('aria-pressed')).toBe('true')
    expect(chips()[0].hasAttribute('data-selected')).toBe(true)
    expect(chips()[1].getAttribute('aria-pressed')).toBe('false')
  })

  it('emits selectionchange with the resolved items', () => {
    const seen: unknown[] = []
    host.addEventListener('selectionchange', (e) => seen.push((e as CustomEvent).detail))
    chips()[1].click()
    expect(seen).toEqual([{ selection: ['code'], items: [items[1]] }])
  })

  it('submits one hidden input per selected value', () => {
    document.body.innerHTML = '<form><gg-chip-group id="f" name="tags" mode="multi"></gg-chip-group></form>'
    const el = document.getElementById('f') as typeof host
    el.items = items
    el.selection = ['design', 'devops']
    expect(new FormData(document.querySelector('form')!).getAll('tags')).toEqual(['design', 'devops'])
  })
})

describe('removal', () => {
  it('fires chipremove on Delete without mutating items', () => {
    const seen: unknown[] = []
    host.addEventListener('chipremove', (e) => seen.push((e as CustomEvent).detail))
    chips()[0].focus()
    key(chips()[0], 'Delete')
    expect(seen).toEqual([{ value: 'design', item: items[0] }])
    expect(chips()).toHaveLength(4) // the owner has not removed it yet
  })

  it('fires from the dismiss affordance without also toggling selection', () => {
    const removed: unknown[] = []
    const selected: unknown[] = []
    host.addEventListener('chipremove', (e) => removed.push((e as CustomEvent).detail))
    host.addEventListener('selectionchange', (e) => selected.push((e as CustomEvent).detail))
    ;(chips()[0].querySelector('[data-part="remove"]') as HTMLElement).click()
    expect(removed).toHaveLength(1)
    expect(selected).toHaveLength(0)
  })

  it('advertises the keyboard shortcut on removable chips', () => {
    expect(chips()[0].getAttribute('aria-keyshortcuts')).toBe('Delete')
  })

  it('moves focus onto the neighbour once the owner shrinks the list', () => {
    host.addEventListener('chipremove', (e) => {
      const { value } = (e as CustomEvent).detail
      host.items = host.items.filter((i) => i.value !== value)
    })
    chips()[3].focus()
    key(chips()[3], 'Delete')
    expect(chips()).toHaveLength(3)
    // Not chips()[2] — that is the disabled Docs chip, which cannot take focus.
    expect(document.activeElement).toBe(chips()[1])
    expect((document.activeElement as HTMLButtonElement).disabled).toBe(false)
  })
})

describe('disabled', () => {
  it('disables every chip when the group is disabled', () => {
    document.body.innerHTML = '<gg-chip-group id="d" disabled></gg-chip-group>'
    const el = document.getElementById('d') as typeof host
    el.items = items
    const all = [...document.querySelectorAll('[data-scope="chip"][data-part="root"]')] as HTMLButtonElement[]
    expect(all.every((c) => c.disabled)).toBe(true)
  })
})
