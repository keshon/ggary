import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChipItem } from '../packages/core/src/components/chip-group'
import type { SelectItem } from '../packages/core/src/components/select'
import type { GgChipGroupElement, GgSelectElement } from '../packages/elements/src/index'

/**
 * What only the custom elements have: a property API, DOM event names and
 * shapes, attribute fallbacks for server-rendered pages, and light-DOM
 * enhancement. The shared contract lives in tests/conformance and runs against
 * this adapter too; nothing here is repeated there.
 */

vi.mock('@ggary/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ggary/core')>()),
  attachPositioner: () => () => {},
}))

beforeAll(async () => {
  await import('../packages/elements/src/index')
})

beforeEach(() => {
  document.body.replaceChildren()
})

const selectItems: SelectItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
]

const chipItems: ChipItem[] = [
  { value: 'design', label: 'Design' },
  { value: 'code', label: 'Code' },
]

describe('<gg-select>', () => {
  const mount = (html = '<gg-select></gg-select>') => {
    document.body.innerHTML = html
    return document.querySelector('gg-select') as GgSelectElement
  }

  it('exposes value as a property, readable and writable', () => {
    const el = mount()
    el.items = selectItems
    expect(el.value).toBeNull()
    el.value = 'b'
    expect(el.value).toBe('b')
    expect(el.querySelector('[data-part="trigger"]')!.textContent).toContain('Bravo')
  })

  it('dispatches a bubbling valuechange event with { value, item }', () => {
    const el = mount()
    el.items = selectItems
    const seen: unknown[] = []
    document.body.addEventListener('valuechange', (e) => seen.push((e as CustomEvent).detail))
    ;(el.querySelector('[data-part="trigger"]') as HTMLElement).click()
    ;(el.querySelectorAll('[data-part="item"]')[1] as HTMLElement).click()
    expect(seen).toEqual([{ value: 'b', item: selectItems[1] }])
  })

  it('reads items from a JSON attribute when no property was set — for server-rendered pages', () => {
    const el = mount(`<gg-select items='${JSON.stringify(selectItems)}' value="a"></gg-select>`)
    expect(el.querySelectorAll('[data-part="item"]')).toHaveLength(2)
    expect(el.value).toBe('a')
  })
})

describe('<gg-chip-group>', () => {
  const mount = () => {
    document.body.innerHTML = '<gg-chip-group removable></gg-chip-group>'
    const el = document.querySelector('gg-chip-group') as GgChipGroupElement
    el.items = chipItems
    return el
  }
  const chips = (el: Element) => [...el.querySelectorAll('[data-scope="chip"][data-part="root"]')] as HTMLElement[]

  it('exposes selection as a property, readable and writable', () => {
    const el = mount()
    el.selection = ['code']
    expect(el.selection).toEqual(['code'])
    expect(chips(el)[1].getAttribute('aria-pressed')).toBe('true')
  })

  it('dispatches bubbling selectionchange and chipremove events', () => {
    const el = mount()
    const events: [string, unknown][] = []
    for (const type of ['selectionchange', 'chipremove']) {
      document.body.addEventListener(type, (e) => events.push([type, (e as CustomEvent).detail]))
    }
    chips(el)[0].click()
    ;(chips(el)[1].querySelector('[data-part="remove"]') as HTMLElement).click()
    expect(events).toEqual([
      ['selectionchange', { selection: ['design'], items: [chipItems[0]] }],
      ['chipremove', { value: 'code', item: chipItems[1] }],
    ])
  })
})

describe('light-DOM enhancement', () => {
  it('<gg-button> decorates the button it was given rather than replacing it', () => {
    document.body.innerHTML = '<gg-button emphasis="high"><button id="server-rendered">Save</button></gg-button>'
    const button = document.getElementById('server-rendered')!
    expect(button.dataset.scope).toBe('button')
    expect(button.dataset.emphasis).toBe('high')
    expect(button.textContent).toBe('Save')
  })

  it('<gg-chip removable> appends a dismiss target with a glyph part and dispatches remove', () => {
    document.body.innerHTML = '<gg-chip removable><span>Tag</span></gg-chip>'
    const chip = document.querySelector('gg-chip')!
    const remove = chip.querySelector('[data-part="remove"]') as HTMLElement
    expect(remove.querySelector('[data-part="remove-icon"][data-icon="close"]')).toBeTruthy()

    const removed = vi.fn()
    document.body.addEventListener('remove', removed)
    remove.click()
    expect(removed).toHaveBeenCalledTimes(1)
  })

  it('<gg-chip> with a <span> is not interactive: no aria-pressed, no tab stop', () => {
    document.body.innerHTML = '<gg-chip><span>Tag</span></gg-chip>'
    const chip = document.querySelector('gg-chip')!
    expect(chip.hasAttribute('aria-pressed')).toBe(false)
    expect(chip.hasAttribute('tabindex')).toBe(false)
  })
})
