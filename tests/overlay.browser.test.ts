import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'
import { coolDownTooltips } from '../packages/core/src/components/tooltip/tooltip.machine'
import { openLayerCount } from '../packages/core/src/utils/dismissable'
import type { GgDialogElement, GgMenuElement, GgMenubarElement, GgPopoverElement, GgSelectElement } from '../packages/elements/src/index'

/**
 * Popover and Tooltip where only a browser can answer: real placement and
 * flipping, the top layer escaping a clipping ancestor, real hover and
 * keyboard focus, and the dismiss stack across nested overlays.
 */
beforeEach(async () => {
  coolDownTooltips()
  await page.viewport(800, 600)
})

afterEach(() => {
  document.body.replaceChildren()
})

const settle = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms))

function mount(html: string) {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const box = (el: Element) => el.getBoundingClientRect()

describe('popover in a real browser', () => {
  it('sits under its trigger in the top layer, unclipped by an ancestor that hides overflow', async () => {
    const host = mount(`
      <div style="position: absolute; top: 40px; left: 40px; overflow: hidden; width: 120px; height: 40px">
        <gg-popover heading="Filters">
          <button slot="trigger">Filters</button>
          <div style="width: 240px; height: 160px">Content</div>
        </gg-popover>
      </div>`)
    const popover = host.querySelector('gg-popover') as GgPopoverElement
    const trigger = host.querySelector('[slot="trigger"]')!
    await userEvent.click(trigger)
    await settle()
    const content = host.querySelector('[data-scope="popover"][data-part="content"]') as HTMLElement
    expect(content.matches(':popover-open')).toBe(true)
    expect(Math.round(box(content).top)).toBe(Math.round(box(trigger).bottom + 6))
    expect(Math.round(box(content).left)).toBe(Math.round(box(trigger).left))
    // 160px tall inside a 40px box that clips, and still hit-testable at its centre.
    const hit = document.elementFromPoint(box(content).left + 120, box(content).top + 100)
    expect(content.contains(hit)).toBe(true)
    expect(popover.open).toBe(true)
  })

  it('flips above its trigger when there is no room below', async () => {
    const host = mount(`
      <gg-popover style="position: absolute; left: 40px; top: 540px">
        <button slot="trigger">Near the bottom</button>
        <div style="height: 200px">Content</div>
      </gg-popover>`)
    const trigger = host.querySelector('[slot="trigger"]')!
    await userEvent.click(trigger)
    await settle()
    const content = host.querySelector('[data-scope="popover"][data-part="content"]') as HTMLElement
    expect(content.dataset.placement).toBe('top-start')
    expect(box(content).bottom).toBeLessThanOrEqual(box(trigger).top)
  })

  it('inside a dialog: Escape closes the popover, then the dialog; a press inside the popover closes neither', async () => {
    const host = mount(`
      <gg-dialog heading="Settings">
        <gg-popover heading="More">
          <button slot="trigger">More</button>
          <button id="inside">Inside</button>
        </gg-popover>
      </gg-dialog>`)
    const dialog = host.querySelector('gg-dialog') as GgDialogElement
    const popover = host.querySelector('gg-popover') as GgPopoverElement
    dialog.show()
    await userEvent.click(host.querySelector('[slot="trigger"]')!)
    await settle()
    expect(openLayerCount()).toBe(2)

    await userEvent.click(host.querySelector('#inside')!)
    expect(popover.open).toBe(true)
    expect(dialog.open).toBe(true)

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(popover.open).toBe(false)
    expect(dialog.open).toBe(true)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(dialog.open).toBe(false)
  })
})

describe('select in a real browser', () => {
  const plans = [
    { value: 'free', label: 'Free' },
    { value: 'team', label: 'Team' },
    { value: 'business', label: 'Business' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  /** Every option can be hit where it is drawn: nothing clips the listbox. */
  const allOptionsReachable = (select: Element) =>
    [...select.querySelectorAll('[data-part="item"]')].map((item) => {
      const r = box(item)
      const hit = document.elementFromPoint(r.left + 8, r.top + r.height / 2)
      return !!hit && item.contains(hit)
    })

  it('is not clipped by an ancestor that hides overflow', async () => {
    const host = mount(`
      <div style="position: absolute; top: 40px; left: 40px; width: 220px; height: 70px; overflow: hidden">
        <gg-select label="Plan"></gg-select>
      </div>`)
    const select = host.querySelector('gg-select') as GgSelectElement
    select.items = plans
    await userEvent.click(select.querySelector('[data-part="trigger"]')!)
    await settle()
    expect(allOptionsReachable(select)).toEqual([true, true, true, true])
  })

  it('opens out of a dialog body instead of inside its scroll box', async () => {
    const host = mount(`
      <gg-dialog heading="Upgrade">
        <gg-select label="Plan"></gg-select>
        <div style="height: 400px">More settings below</div>
      </gg-dialog>`)
    const dialog = host.querySelector('gg-dialog') as GgDialogElement
    const select = host.querySelector('gg-select') as GgSelectElement
    // Long enough that a listbox kept inside the dialog body must shrink or be cut.
    select.items = [...plans, ...plans.map((plan) => ({ value: `${plan.value}-yearly`, label: `${plan.label}, yearly` }))]
    // A theme caps a dialog's height and its body scrolls; this dialog is short.
    host.querySelector('dialog')!.style.maxHeight = '200px'
    dialog.show()
    await userEvent.click(select.querySelector('[data-part="trigger"]')!)
    await settle()
    expect(allOptionsReachable(select)).toEqual(Array(8).fill(true))
    await userEvent.click([...select.querySelectorAll('[data-part="item"]')][7])
    expect(select.value).toBe('enterprise-yearly')
    expect(dialog.open).toBe(true)
  })
})

describe('select opening far down a long list', () => {
  it('shows the selected option, measured against the height the positioner gave the list', async () => {
    await page.viewport(800, 300)
    const host = mount(`<gg-select label="Item" style="position: absolute; top: 20px; left: 20px"></gg-select>`)
    const select = host.querySelector('gg-select') as GgSelectElement
    select.items = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}` }))
    select.value = 'v28'
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
    const host = mount(`
      <div style="padding: 120px">
        <gg-tooltip content="Copy link" open-delay="80" close-delay="40"><button>Copy</button></gg-tooltip>
      </div>`)
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
    const host = mount(`
      <button id="before">Before</button>
      <gg-tooltip content="Archive" open-delay="5000"><button id="target">Archive</button></gg-tooltip>`)
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
    const host = mount(`
      <button id="elsewhere">Elsewhere</button>
      <gg-popover heading="Actions">
        <button slot="trigger">Actions</button>
        <gg-tooltip content="Deletes for everyone" open-delay="0"><button id="delete">Delete</button></gg-tooltip>
      </gg-popover>`)
    const popover = host.querySelector('gg-popover') as GgPopoverElement
    await userEvent.click(host.querySelector('[slot="trigger"]')!)
    await settle()
    await userEvent.hover(host.querySelector('#delete')!)
    await settle()
    expect(openLayerCount()).toBe(2)

    await userEvent.click(host.querySelector('#elsewhere')!)
    await settle()
    expect(popover.open).toBe(false)
  })
})

describe('menu in a real browser', () => {
  const actions = [
    { value: 'edit', label: 'Edit', shortcut: 'E' },
    { value: 'duplicate', label: 'Duplicate' },
    { type: 'separator' as const },
    { value: 'delete', label: 'Delete', tone: 'danger' as const },
  ]

  const item = (host: Element, label: string) =>
    [...host.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]')].find(
      (el) => el.querySelector('[data-part="item-text"]')!.textContent === label
    )!

  it('the keyboard alone: Tab to the trigger, open, walk, choose, and focus is back on the trigger', async () => {
    const host = mount(`
      <button id="before">Before</button>
      <gg-menu style="position: absolute; top: 80px; left: 60px"><button slot="trigger">Actions</button></gg-menu>`)
    const menu = host.querySelector('gg-menu') as GgMenuElement
    menu.items = actions
    const chosen: string[] = []
    menu.addEventListener('itemselect', (event) => chosen.push((event as CustomEvent).detail.value))
    const trigger = host.querySelector('[slot="trigger"]') as HTMLElement

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
    const host = mount(`<gg-menu><button slot="trigger">Actions</button></gg-menu>`)
    const menu = host.querySelector('gg-menu') as GgMenuElement
    menu.items = actions
    const chosen: string[] = []
    menu.addEventListener('itemselect', (event) => chosen.push((event as CustomEvent).detail.value))
    await userEvent.click(host.querySelector('[slot="trigger"]')!)
    await settle()
    const content = host.querySelector('[data-scope="menu"][data-part="content"]') as HTMLElement
    expect(document.activeElement).toBe(content)

    await userEvent.hover(item(host, 'Duplicate'))
    expect(item(host, 'Duplicate').hasAttribute('data-highlighted')).toBe(true)
    expect(document.activeElement).toBe(item(host, 'Duplicate'))
    // Off the rows: no row stays lit under a pointer that is on none.
    await userEvent.hover(host.querySelector('[slot="trigger"]')!)
    expect(host.querySelector('[data-part="item"][data-highlighted]')).toBeNull()
    expect(document.activeElement).toBe(content)

    await userEvent.click(item(host, 'Edit'))
    await settle()
    expect(chosen).toEqual(['edit'])
    expect(menu.open).toBe(false)
  })

  it('a long menu scrolls inside the viewport, and the keyboard keeps its row in view', async () => {
    await page.viewport(800, 300)
    const host = mount(`<gg-menu style="position: absolute; top: 20px; left: 20px"><button slot="trigger">Many</button></gg-menu>`)
    const menu = host.querySelector('gg-menu') as GgMenuElement
    menu.items = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}` }))
    const trigger = host.querySelector('[slot="trigger"]') as HTMLElement
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

  const fileMenu = [
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
    const host = mount(`
      <gg-menu id="left" style="position: absolute; top: 40px; left: 40px"><button slot="trigger">File</button></gg-menu>
      <gg-menu id="right" style="position: absolute; top: 40px; right: 10px"><button slot="trigger">Edit</button></gg-menu>`)
    for (const id of ['left', 'right']) (host.querySelector(`#${id}`) as GgMenuElement).items = fileMenu

    const left = host.querySelector('#left') as GgMenuElement
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

    const right = host.querySelector('#right') as GgMenuElement
    await userEvent.click(right.querySelector('button')!)
    await userEvent.hover(item(right, 'Open Recent'))
    await settle()
    const flipped = document.getElementById(item(right, 'Open Recent').getAttribute('aria-controls')!)!
    expect(box(flipped).right).toBeLessThanOrEqual(box(item(right, 'Open Recent')).left + 1)
  })

  it('the pointer may cross a sibling row on its way to a submenu, but not wander off', async () => {
    const host = mount(`<gg-menu style="position: absolute; top: 40px; left: 40px"><button slot="trigger">File</button></gg-menu>`)
    const menu = host.querySelector('gg-menu') as GgMenuElement
    // Wide rows, so a diagonal path to the submenu crosses the row below.
    menu.items = fileMenu
    menu.style.setProperty('--row-width', '200px')
    await userEvent.click(menu.querySelector('button')!)
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
    const host = mount(`
      <gg-dialog heading="Settings">
        <gg-menu><button slot="trigger">More</button></gg-menu>
      </gg-dialog>`)
    const dialog = host.querySelector('gg-dialog') as GgDialogElement
    const menu = host.querySelector('gg-menu') as GgMenuElement
    menu.items = actions
    dialog.show()
    await settle()
    await userEvent.click(host.querySelector('[slot="trigger"]')!)
    await settle()
    expect(openLayerCount()).toBe(2)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(menu.open).toBe(false)
    expect(dialog.open).toBe(true)
  })
})

describe('menubar in a real browser', () => {
  const menus = [
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
    const host = mount(`<button id="before">Before</button><gg-menubar label="Application" mnemonics></gg-menubar>`)
    const bar = host.querySelector('gg-menubar') as GgMenubarElement
    bar.menus = menus
    const chosen: string[] = []
    bar.addEventListener('itemselect', (event) => chosen.push(`${(event as CustomEvent).detail.menu}/${(event as CustomEvent).detail.value}`))
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
    expect(bar.querySelector('[data-part="root"]')!.hasAttribute('data-mnemonics')).toBe(true)
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
