import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import { createElement as h, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { Dialog, Menu, Menubar, Popover, Select, Tooltip } from '../packages/react/src/index'
import type { Dict } from '../packages/core/src/index'
import type { MenuEntry } from '../packages/core/src/components/menu'
import type { MenubarMenu } from '../packages/core/src/components/menubar'
import type { SelectItem } from '../packages/core/src/components/select'
import { coolDownTooltips } from '../packages/core/src/components/tooltip/tooltip.machine'
import { openLayerCount } from '../packages/core/src/utils/dismissable'

/**
 * Popover and Tooltip where only a browser can answer: real placement and
 * flipping, the top layer escaping a clipping ancestor, real hover and
 * keyboard focus, and the dismiss stack across nested overlays.
 */
beforeEach(async () => {
  coolDownTooltips()
  await page.viewport(800, 600)
})

const roots: Root[] = []
afterEach(() => {
  for (const root of roots.splice(0)) root.unmount()
  document.body.replaceChildren()
})

const settle = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

/** Renders synchronously, so the components are in the page when this returns. */
function mount(node: ReactNode) {
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  roots.push(root)
  flushSync(() => root.render(node))
  return host
}

/** A plain button that takes a component's trigger props, marked so the test can find it. */
const triggerButton = (text: string, attrs: Dict = {}) => (props: Dict) =>
  h('button', { ...props, ...attrs, 'data-testid': 'trigger' }, text)

const box = (el: Element) => el.getBoundingClientRect()

/** Open state read from the page: a popover's or menu's content is in the top layer. */
const popoverOpen = (host: Element) => !!host.querySelector('[data-scope="popover"][data-part="content"]')?.matches(':popover-open')
const menuOpen = (host: Element) => !!host.querySelector('[data-scope="menu"][data-part="content"]')?.matches(':popover-open')
const dialogOf = (host: Element) => host.querySelector('dialog') as HTMLDialogElement

describe('popover in a real browser', () => {
  it('sits under its trigger in the top layer, unclipped by an ancestor that hides overflow', async () => {
    const host = mount(
      h(
        'div',
        { style: { position: 'absolute', top: 40, left: 40, overflow: 'hidden', width: 120, height: 40 } },
        h(Popover, { title: 'Filters', trigger: triggerButton('Filters') }, h('div', { style: { width: 240, height: 160 } }, 'Content'))
      )
    )
    const trigger = host.querySelector('[data-testid="trigger"]')!
    await userEvent.click(trigger)
    await settle()
    const content = host.querySelector('[data-scope="popover"][data-part="content"]') as HTMLElement
    expect(content.matches(':popover-open')).toBe(true)
    expect(Math.round(box(content).top)).toBe(Math.round(box(trigger).bottom + 6))
    expect(Math.round(box(content).left)).toBe(Math.round(box(trigger).left))
    // 160px tall inside a 40px box that clips, and still hit-testable at its centre.
    const hit = document.elementFromPoint(box(content).left + 120, box(content).top + 100)
    expect(content.contains(hit)).toBe(true)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('flips above its trigger when there is no room below', async () => {
    const host = mount(
      h(
        'div',
        { style: { position: 'absolute', left: 40, top: 540 } },
        h(Popover, { trigger: triggerButton('Near the bottom') }, h('div', { style: { height: 200 } }, 'Content'))
      )
    )
    const trigger = host.querySelector('[data-testid="trigger"]')!
    await userEvent.click(trigger)
    await settle()
    const content = host.querySelector('[data-scope="popover"][data-part="content"]') as HTMLElement
    expect(content.dataset.placement).toBe('top-start')
    expect(box(content).bottom).toBeLessThanOrEqual(box(trigger).top)
  })

  it('inside a dialog: Escape closes the popover, then the dialog; a press inside the popover closes neither', async () => {
    const host = mount(
      h(
        Dialog,
        { title: 'Settings', defaultOpen: true },
        h(Popover, { title: 'More', trigger: triggerButton('More') }, h('button', { id: 'inside' }, 'Inside'))
      )
    )
    await settle()
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    await settle()
    expect(openLayerCount()).toBe(2)

    await userEvent.click(host.querySelector('#inside')!)
    expect(popoverOpen(host)).toBe(true)
    expect(dialogOf(host).open).toBe(true)

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(popoverOpen(host)).toBe(false)
    expect(dialogOf(host).open).toBe(true)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(dialogOf(host).open).toBe(false)
  })
})

describe('select in a real browser', () => {
  const plans: SelectItem[] = [
    { value: 'free', label: 'Free' },
    { value: 'team', label: 'Team' },
    { value: 'business', label: 'Business' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  const selectOf = (host: Element) => host.querySelector('[data-scope="select"][data-part="root"]')!

  /** Every option can be hit where it is drawn: nothing clips the listbox. */
  const allOptionsReachable = (select: Element) =>
    [...select.querySelectorAll('[data-part="item"]')].map((item) => {
      const r = box(item)
      const hit = document.elementFromPoint(r.left + 8, r.top + r.height / 2)
      return !!hit && item.contains(hit)
    })

  it('is not clipped by an ancestor that hides overflow', async () => {
    const host = mount(
      h(
        'div',
        { style: { position: 'absolute', top: 40, left: 40, width: 220, height: 70, overflow: 'hidden' } },
        h(Select, { label: 'Plan', items: plans })
      )
    )
    const select = selectOf(host)
    await userEvent.click(select.querySelector('[data-part="trigger"]')!)
    await settle()
    expect(allOptionsReachable(select)).toEqual([true, true, true, true])
  })

  it('opens out of a dialog body instead of inside its scroll box', async () => {
    const chosen: (string | null)[] = []
    // Long enough that a listbox kept inside the dialog body must shrink or be cut.
    const items = [...plans, ...plans.map((plan) => ({ value: `${plan.value}-yearly`, label: `${plan.label}, yearly` }))]
    const host = mount(
      h(
        Dialog,
        { title: 'Upgrade', trigger: triggerButton('Upgrade') },
        h(Select, { label: 'Plan', items, onValueChange: (value: string | null) => chosen.push(value) }),
        h('div', { style: { height: 400 } }, 'More settings below')
      )
    )
    // A theme caps a dialog's height and its body scrolls; this dialog is short.
    dialogOf(host).style.maxHeight = '200px'
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    await settle()
    const select = selectOf(host)
    await userEvent.click(select.querySelector('[data-part="trigger"]')!)
    await settle()
    expect(allOptionsReachable(select)).toEqual(Array(8).fill(true))
    await userEvent.click([...select.querySelectorAll('[data-part="item"]')][7])
    expect(chosen.at(-1)).toBe('enterprise-yearly')
    expect(dialogOf(host).open).toBe(true)
  })
})

describe('select opening far down a long list', () => {
  it('shows the selected option, measured against the height the positioner gave the list', async () => {
    await page.viewport(800, 300)
    const items = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}` }))
    const host = mount(h('div', { style: { position: 'absolute', top: 20, left: 20 } }, h(Select, { label: 'Item', items, defaultValue: 'v28' })))
    const select = host.querySelector('[data-scope="select"][data-part="root"]')!
    await userEvent.click(select.querySelector('[data-part="trigger"]')!)
    await settle()
    const content = select.querySelector('[data-part="content"]') as HTMLElement
    const option = select.querySelector('[data-value="v28"]') as HTMLElement
    expect(box(option).bottom).toBeLessThanOrEqual(box(content).bottom + 1)
    expect(box(option).top).toBeGreaterThanOrEqual(box(content).top - 1)
  })
})

describe('tooltip in a real browser', () => {
  it('a real hover shows it above the trigger after the delay; leaving hides it', async () => {
    const host = mount(
      h('div', { style: { padding: 120 } }, h(Tooltip, { content: 'Copy link', openDelay: 80, closeDelay: 40, trigger: triggerButton('Copy') }))
    )
    const trigger = host.querySelector('button')!
    const content = host.querySelector('[data-scope="tooltip"]') as HTMLElement
    await userEvent.hover(trigger)
    expect(content.matches(':popover-open')).toBe(false)
    await settle(140)
    expect(content.matches(':popover-open')).toBe(true)
    expect(content.dataset.placement).toBe('top')
    expect(box(content).bottom).toBeLessThanOrEqual(box(trigger).top)

    await userEvent.unhover(trigger)
    await settle(120)
    expect(content.matches(':popover-open')).toBe(false)
  })

  it('Tab onto the trigger shows it at once; a mouse click that focuses the trigger does not', async () => {
    const host = mount([
      h('button', { key: 'before', id: 'before' }, 'Before'),
      h(Tooltip, { key: 'tooltip', content: 'Archive', openDelay: 5000, trigger: triggerButton('Archive', { id: 'target' }) }),
    ])
    const content = host.querySelector('[data-scope="tooltip"]') as HTMLElement
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement?.id).toBe('target')
    expect(content.matches(':popover-open')).toBe(true)

    await userEvent.tab()
    expect(content.matches(':popover-open')).toBe(false)
    await userEvent.click(host.querySelector('#target')!)
    await settle()
    expect(content.matches(':popover-open')).toBe(false)
  })

  it('is passive: while it shows, a press outside still closes the popover beneath it', async () => {
    const host = mount([
      h('button', { key: 'elsewhere', id: 'elsewhere' }, 'Elsewhere'),
      h(
        Popover,
        { key: 'popover', title: 'Actions', trigger: triggerButton('Actions') },
        h(Tooltip, { content: 'Deletes for everyone', openDelay: 0, trigger: (props: Dict) => h('button', { ...props, id: 'delete' }, 'Delete') })
      ),
    ])
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    await settle()
    await userEvent.hover(host.querySelector('#delete')!)
    await settle()
    expect(openLayerCount()).toBe(2)

    await userEvent.click(host.querySelector('#elsewhere')!)
    await settle()
    expect(popoverOpen(host)).toBe(false)
  })
})

describe('menu in a real browser', () => {
  const actions: MenuEntry[] = [
    { value: 'edit', label: 'Edit', shortcut: 'E' },
    { value: 'duplicate', label: 'Duplicate' },
    { type: 'separator' as const },
    { value: 'delete', label: 'Delete', tone: 'danger' as const },
  ]

  const item = (host: Element, label: string) =>
    [...host.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]')].find(
      (el) => el.querySelector('[data-part="item-text"]')!.textContent === label
    )!

  /** A menu on a plain trigger, placed by a wrapper as the page would place it. */
  const menu = (items: MenuEntry[], text: string, options: { style?: Dict; onSelect?: (value: string) => void; id?: string } = {}) =>
    h(
      'div',
      { key: options.id ?? text, id: options.id, style: options.style },
      h(Menu, { items, onSelect: options.onSelect, trigger: triggerButton(text) })
    )

  it('the keyboard alone: Tab to the trigger, open, walk, choose, and focus is back on the trigger', async () => {
    const chosen: string[] = []
    const host = mount([
      h('button', { key: 'before', id: 'before' }, 'Before'),
      menu(actions, 'Actions', { style: { position: 'absolute', top: 80, left: 60 }, onSelect: (value) => chosen.push(value) }),
    ])
    const trigger = host.querySelector('[data-testid="trigger"]') as HTMLElement

    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(trigger)
    await userEvent.keyboard('{Enter}')
    await settle()
    const content = host.querySelector('[data-scope="menu"][data-part="content"]') as HTMLElement
    expect(content.matches(':popover-open')).toBe(true)
    expect(document.activeElement).toBe(item(host, 'Edit'))
    expect(Math.round(box(content).top)).toBe(Math.round(box(trigger).bottom + 4))

    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(item(host, 'Delete'))
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(chosen).toEqual(['delete'])
    expect(content.matches(':popover-open')).toBe(false)
    expect(document.activeElement).toBe(trigger)
  })

  it('a real pointer: hovering highlights and focuses a row, a click chooses it', async () => {
    const chosen: string[] = []
    const host = mount(menu(actions, 'Actions', { onSelect: (value) => chosen.push(value) }))
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    await settle()
    const content = host.querySelector('[data-scope="menu"][data-part="content"]') as HTMLElement
    expect(document.activeElement).toBe(content)

    await userEvent.hover(item(host, 'Duplicate'))
    expect(item(host, 'Duplicate').hasAttribute('data-highlighted')).toBe(true)
    expect(document.activeElement).toBe(item(host, 'Duplicate'))
    // Off the rows: no row stays lit under a pointer that is on none.
    await userEvent.hover(host.querySelector('[data-testid="trigger"]')!)
    expect(host.querySelector('[data-part="item"][data-highlighted]')).toBeNull()
    expect(document.activeElement).toBe(content)

    await userEvent.click(item(host, 'Edit'))
    await settle()
    expect(chosen).toEqual(['edit'])
    expect(menuOpen(host)).toBe(false)
  })

  it('a long menu scrolls inside the viewport, and the keyboard keeps its row in view', async () => {
    await page.viewport(800, 300)
    const many = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}` }))
    const host = mount(menu(many, 'Many', { style: { position: 'absolute', top: 20, left: 20 } }))
    const trigger = host.querySelector('[data-testid="trigger"]') as HTMLElement
    trigger.focus()
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    const content = host.querySelector('[data-scope="menu"][data-part="content"]') as HTMLElement
    expect(box(content).bottom).toBeLessThanOrEqual(300)
    expect(content.scrollTop).toBeGreaterThan(0)
    const last = item(host, 'Item 29')
    expect(document.activeElement).toBe(last)
    expect(box(last).bottom).toBeLessThanOrEqual(box(content).bottom + 1)
  })

  const fileMenu: MenuEntry[] = [
    { value: 'new', label: 'New' },
    {
      type: 'submenu' as const,
      value: 'recent',
      label: 'Open Recent',
      items: [
        { value: 'a', label: 'a.txt' },
        { value: 'b', label: 'b.txt' },
      ],
    },
    { value: 'save', label: 'Save' },
    { value: 'quit', label: 'Quit' },
  ]

  it('a submenu opens beside its row with its first row level with it, and flips when there is no room', async () => {
    const host = mount([
      menu(fileMenu, 'File', { id: 'left', style: { position: 'absolute', top: 40, left: 40 } }),
      menu(fileMenu, 'Edit', { id: 'right', style: { position: 'absolute', top: 40, right: 10 } }),
    ])

    const left = host.querySelector('#left') as HTMLElement
    await userEvent.click(left.querySelector('button')!)
    await userEvent.hover(item(left, 'Open Recent'))
    await settle()
    const row = item(left, 'Open Recent')
    const submenu = document.getElementById(row.getAttribute('aria-controls')!)!
    expect(submenu.matches(':popover-open')).toBe(true)
    expect(document.activeElement).toBe(row)
    expect(box(submenu).left).toBeGreaterThanOrEqual(box(row).right)
    expect(Math.abs(box(item(left, 'a.txt')).top - box(row).top)).toBeLessThan(1)
    await userEvent.keyboard('{Escape}{Escape}')

    const right = host.querySelector('#right') as HTMLElement
    await userEvent.click(right.querySelector('button')!)
    await userEvent.hover(item(right, 'Open Recent'))
    await settle()
    const flipped = document.getElementById(item(right, 'Open Recent').getAttribute('aria-controls')!)!
    expect(box(flipped).right).toBeLessThanOrEqual(box(item(right, 'Open Recent')).left + 1)
  })

  it('the pointer may cross a sibling row on its way to a submenu, but not wander off', async () => {
    const host = mount(menu(fileMenu, 'File', { style: { position: 'absolute', top: 40, left: 40 } }))
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    // Wide rows, so a diagonal path to the submenu crosses the row below.
    for (const row of host.querySelectorAll<HTMLElement>('[data-part="item"]')) row.style.width = '200px'
    const recent = item(host, 'Open Recent')
    const save = item(host, 'Save')
    await userEvent.hover(recent, { position: { x: 190, y: 4 } })
    await settle()
    expect(recent.getAttribute('aria-expanded')).toBe('true')

    // Down and to the right, onto Save's right end, heading for the submenu: kept.
    await userEvent.hover(save, { position: { x: 196, y: 2 } })
    expect(recent.getAttribute('aria-expanded')).toBe('true')
    await userEvent.hover(item(host, 'b.txt'))
    expect(document.activeElement).toBe(item(host, 'b.txt'))

    // Back, and away to the left end of Save: that is choosing Save.
    await userEvent.hover(recent, { position: { x: 190, y: 4 } })
    await settle(350)
    await userEvent.hover(save, { position: { x: 10, y: 10 } })
    expect(recent.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(save)
  })

  it('inside a dialog: Escape closes the menu and leaves the dialog open', async () => {
    const host = mount(h(Dialog, { title: 'Settings', defaultOpen: true }, menu(actions, 'More')))
    await settle()
    await userEvent.click(host.querySelector('[data-testid="trigger"]')!)
    await settle()
    expect(openLayerCount()).toBe(2)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(menuOpen(host)).toBe(false)
    expect(dialogOf(host).open).toBe(true)
  })
})

describe('menubar in a real browser', () => {
  const menus: MenubarMenu[] = [
    {
      value: 'file',
      label: '&File',
      items: [
        { value: 'new', label: 'New' },
        { type: 'submenu' as const, value: 'recent', label: 'Open Recent', items: [{ value: 'a', label: 'a.txt' }] },
        { value: 'quit', label: 'Quit' },
      ],
    },
    { value: 'edit', label: '&Edit', items: [{ value: 'undo', label: 'Undo' }, { value: 'redo', label: 'Redo' }] },
    { value: 'view', label: '&View', items: [{ value: 'zoom', label: 'Zoom' }] },
  ]

  const setup = () => {
    const chosen: string[] = []
    const host = mount([
      h('button', { key: 'before', id: 'before' }, 'Before'),
      h(Menubar, {
        key: 'bar',
        label: 'Application',
        mnemonics: true,
        menus,
        onSelect: (value: string, details: { menu: string }) => chosen.push(`${details.menu}/${value}`),
      }),
    ])
    const bar = host.querySelector('[data-scope="menubar"][data-part="root"]') as HTMLElement
    const barItem = (text: string) =>
      [...host.querySelectorAll<HTMLElement>('[data-scope="menubar"][data-part="item"]')].find((el) => el.textContent === text)!
    const row = (label: string) =>
      [...host.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]')].find(
        (el) => el.querySelector(':scope > [data-part="item-text"]')!.textContent === label
      )!
    const label = () => (document.activeElement as HTMLElement).querySelector(':scope > [data-part="item-text"]')?.textContent ?? document.activeElement?.textContent
    return { host, bar, chosen, barItem, row, label }
  }

  it('the keyboard alone: one tab stop, arrows along the bar and between open menus, a menu under its item', async () => {
    const { host, chosen, barItem, label } = setup()
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(barItem('File'))
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(barItem('Edit'))
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(label()).toBe('Undo')
    const content = document.getElementById(barItem('Edit').getAttribute('aria-controls')!)!
    expect(Math.round(box(content).top)).toBe(Math.round(box(barItem('Edit')).bottom + 4))
    expect(Math.round(box(content).left)).toBe(Math.round(box(barItem('Edit')).left))

    await userEvent.keyboard('{ArrowLeft}')
    expect(label()).toBe('New')
    await userEvent.keyboard('{ArrowDown}{ArrowRight}')
    expect(label()).toBe('a.txt')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(chosen).toEqual(['file/a'])
    expect(document.activeElement).toBe(barItem('File'))
    // Shift+Tab leaves the bar from its one stop.
    await userEvent.tab({ shift: true })
    expect(document.activeElement?.id).toBe('before')
  })

  it('Alt+key opens a menu by its access key, and F10 goes to the bar', async () => {
    const { host, bar, barItem, label } = setup()
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.keyboard('{Alt>}v{/Alt}')
    await settle()
    expect(label()).toBe('Zoom')
    await userEvent.keyboard('{Escape}')
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.keyboard('{F10}')
    expect(document.activeElement).toBe(barItem('File'))
    expect(bar.hasAttribute('data-mnemonics')).toBe(true)
  })

  it('a real pointer: a press opens a menu, moving along the bar switches, a click chooses', async () => {
    const { chosen, barItem, row } = setup()
    await userEvent.click(barItem('File'))
    await settle()
    expect(barItem('File').getAttribute('aria-expanded')).toBe('true')
    await userEvent.hover(barItem('View'))
    await settle()
    expect(barItem('File').getAttribute('aria-expanded')).toBe('false')
    expect(barItem('View').getAttribute('aria-expanded')).toBe('true')
    await userEvent.hover(barItem('Edit'))
    await settle()
    await userEvent.click(row('Redo'))
    await settle()
    expect(chosen).toEqual(['edit/redo'])
    expect(barItem('Edit').getAttribute('aria-expanded')).toBe('false')
    expect(openLayerCount()).toBe(0)
  })
})
