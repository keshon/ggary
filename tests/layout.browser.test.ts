import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import '../packages/elements/src/index'
import type { GgShellElement, GgSplitElement } from '../packages/elements/src/index'

/**
 * The frame where only a browser can say: the one breakpoint, the drawer over
 * an inert page, the window growing past the breakpoint with the drawer open,
 * a bar lying down under the header, a separator dragged by a real pointer,
 * and a status strip that stays one line.
 */

const frames = (count = 2) =>
  new Promise<void>((resolve) => {
    let left = count
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick))
    requestAnimationFrame(tick)
  })

const until = async (check: () => boolean, ms = 3000) => {
  const started = performance.now()
  while (!check()) {
    if (performance.now() - started > ms) throw new Error('timed out')
    await frames(1)
  }
}

afterEach(async () => {
  document.body.replaceChildren()
  await page.viewport(1200, 800)
})

function shell(collapse: 'drawer' | 'bar' = 'drawer') {
  const host = document.createElement('gg-shell') as GgShellElement
  host.setAttribute('collapse', collapse)
  host.innerHTML = `
    <a slot="brand" href="#home">Leads app</a>
    <gg-nav slot="aside" label="Sections">
      <div data-group="Work"><a href="#leads" aria-current="page">Leads</a><a href="#deals">Deals</a><a href="#reports">Reports</a></div>
    </gg-nav>
    <span slot="header">Registry</span>
    <span slot="footer">Ready</span>
    <p style="block-size: 3000px">Work</p>
    <button id="in-main">In the work area</button>`
  document.body.style.margin = '0'
  document.body.append(host)
  const part = (name: string) => host.querySelector<HTMLElement>(`:scope > [data-part="${name}"], :scope > * > [data-part="${name}"]`)!
  return { host, part, toggle: () => part('toggle') as HTMLButtonElement, aside: () => part('aside'), main: () => part('main') }
}

describe('the shell', () => {
  it('on a wide screen the column stands beside the work, and only the work scrolls', async () => {
    await page.viewport(1200, 800)
    const { toggle, aside, main } = shell()
    await frames()
    expect(getComputedStyle(toggle()).display).toBe('none')
    expect(aside().getBoundingClientRect().left).toBe(0)
    expect(main().getBoundingClientRect().left).toBeGreaterThanOrEqual(aside().getBoundingClientRect().right - 1)
    main().scrollTop = 500
    await frames()
    expect(main().scrollTop).toBe(500)
    expect(aside().getBoundingClientRect().top).toBe(0)
    expect(document.scrollingElement!.scrollTop).toBe(0)
  })

  it('on a narrow screen the column is a drawer: out of reach until opened, then over an inert page', async () => {
    await page.viewport(600, 800)
    const { host, toggle, aside, main } = shell()
    await frames()
    expect(getComputedStyle(toggle()).display).not.toBe('none')
    expect(getComputedStyle(aside()).visibility).toBe('hidden')
    // Closed, it is out of the tab order: from the toggle, Tab goes on to the work.
    toggle().focus()
    await userEvent.keyboard('{Tab}')
    expect(aside().contains(document.activeElement)).toBe(false)

    await userEvent.click(toggle())
    await until(() => getComputedStyle(aside()).visibility === 'visible' && Math.abs(aside().getBoundingClientRect().left) < 1)
    expect(aside().contains(document.activeElement)).toBe(true)
    expect(main().inert).toBe(true)
    // Tab walks the drawer and never reaches the page under it.
    for (let i = 0; i < 6; i += 1) {
      await userEvent.keyboard('{Tab}')
      expect(main().contains(document.activeElement)).toBe(false)
    }
    await userEvent.keyboard('{Escape}')
    await until(() => host.dataset.state === 'closed')
    expect(document.activeElement).toBe(toggle())
    expect(main().inert).toBe(false)
  })

  it('a window that grows past the breakpoint with the drawer open closes it', async () => {
    await page.viewport(600, 800)
    const { host, toggle, main } = shell()
    await frames()
    await userEvent.click(toggle())
    await until(() => host.dataset.state === 'open')
    await page.viewport(1200, 800)
    await until(() => host.dataset.state === 'closed')
    expect(main().inert).toBe(false)
  })

  it('a bar lies down under the header, its navigation in a row', async () => {
    await page.viewport(600, 800)
    const { part, toggle, aside } = shell('bar')
    await frames()
    expect(getComputedStyle(toggle()).display).toBe('none')
    const header = part('header').getBoundingClientRect()
    expect(aside().getBoundingClientRect().top).toBeGreaterThanOrEqual(header.bottom - 1)
    const links = [...aside().querySelectorAll('[data-scope="nav"][data-part="item"]')].map((link) => link.getBoundingClientRect())
    expect(new Set(links.map((box) => Math.round(box.top))).size).toBe(1)
    expect(aside().querySelector<HTMLElement>('[data-part="group-label"]')!.getBoundingClientRect().width).toBe(0)
  })
})

describe('the split', () => {
  function split(attributes: Record<string, string> = {}) {
    const host = document.createElement('gg-split') as GgSplitElement
    host.setAttribute('label', 'Resize the list')
    for (const [name, value] of Object.entries({ 'default-size': '300', min: '200', max: '560', 'rest-min': '240', ...attributes })) host.setAttribute(name, value)
    host.style.cssText = 'inline-size: 900px; block-size: 300px'
    host.innerHTML = '<section>List</section><section>Detail</section>'
    document.body.append(host)
    const separator = () => host.querySelector<HTMLElement>('[data-part="separator"]')!
    const first = () => host.querySelector<HTMLElement>('[data-part="pane"]')!
    const drag = async (toX: number) => {
      const box = separator().getBoundingClientRect()
      const x = box.left + box.width / 2
      const y = box.top + box.height / 2
      const at = (type: string, clientX: number) =>
        separator().dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX, clientY: y }))
      at('pointerdown', x)
      at('pointermove', toX)
      at('pointerup', toX)
      await frames()
    }
    return { host, separator, first, drag }
  }

  it('the first pane is as wide as the separator says, and follows a drag', async () => {
    const { host, separator, first, drag } = split()
    await frames()
    expect(first().getBoundingClientRect().width).toBeCloseTo(300, 0)
    const left = host.getBoundingClientRect().left
    await drag(left + 420)
    expect(Number(separator().getAttribute('aria-valuenow'))).toBeCloseTo(420, -1)
    expect(first().getBoundingClientRect().width).toBeCloseTo(Number(separator().getAttribute('aria-valuenow')), 0)
    // The separator's line sits under the pointer.
    const line = separator().getBoundingClientRect()
    expect(Math.abs(line.left + line.width / 2 - (left + 420))).toBeLessThan(2)
  })

  it('a drag stops where the other pane would fall under its minimum, and past half the minimum folds a collapsible pane', async () => {
    const { host, separator, first, drag } = split({ collapsible: '' })
    await frames()
    const box = host.getBoundingClientRect()
    await drag(box.right - 10)
    // 900 wide, 240 kept for the other pane: the first stops short of its own 560.
    expect(first().getBoundingClientRect().width).toBeLessThanOrEqual(900 - 240)
    expect(host.querySelectorAll<HTMLElement>('[data-part="pane"]')[1].getBoundingClientRect().width).toBeGreaterThanOrEqual(240 - 1)
    await drag(box.left + 40)
    expect(first().hidden).toBe(true)
    expect(separator().getAttribute('aria-valuenow')).toBe('0')
  })

  it('the keyboard moves it and the layout goes along', async () => {
    const { separator, first } = split()
    await frames()
    separator().focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Shift>}{ArrowRight}{/Shift}')
    await frames()
    expect(separator().getAttribute('aria-valuenow')).toBe(String(300 + 16 * 2 + 64))
    expect(first().getBoundingClientRect().width).toBeCloseTo(396, 0)
  })
})

describe('the status bar', () => {
  it('stays one line in a narrow frame, and pans rather than cut off its end', async () => {
    const bar = document.createElement('gg-status-bar')
    bar.style.inlineSize = '220px'
    bar.innerHTML = '<span>main</span><span data-tone="error">2 errors</span><span>Ln 12, Col 4</span><span data-spacer></span><span>UTF-8</span><span>Spaces: 2</span>'
    document.body.append(bar)
    await frames()
    const items = [...bar.querySelectorAll('[data-part="item"]')].map((item) => item.getBoundingClientRect())
    expect(new Set(items.map((box) => Math.round(box.top))).size).toBe(1)
    expect(bar.getBoundingClientRect().height).toBeLessThan(34)
    expect(bar.scrollWidth).toBeGreaterThan(bar.clientWidth)
  })
})

describe('buttons inside the frame', () => {
  it('a status strip keeps air around a button in it, at its own one-line height', async () => {
    const bar = document.createElement('gg-status-bar')
    bar.style.inlineSize = '400px'
    bar.innerHTML = '<span>700,000 leads</span><span data-spacer></span><gg-button size="sm" emphasis="minimal"><button>Sync</button></gg-button>'
    document.body.append(bar)
    await frames()
    const strip = bar.getBoundingClientRect()
    const button = bar.querySelector('button')!.getBoundingClientRect()
    expect(button.top - strip.top).toBeGreaterThanOrEqual(2)
    expect(strip.bottom - button.bottom).toBeGreaterThanOrEqual(2)
    expect(strip.right - button.right).toBeGreaterThanOrEqual(4)
    expect(strip.height).toBeLessThan(34)
  })

  it('a button group of custom elements stands flush: square inner corners, rounded ends', async () => {
    const group = document.createElement('gg-button-group')
    group.setAttribute('label', 'Align')
    group.innerHTML = ['Left', 'Centre', 'Right'].map((label) => `<gg-button><button>${label}</button></gg-button>`).join('')
    document.body.append(group)
    await frames()
    const buttons = [...group.querySelectorAll('button')]
    const radius = (button: Element) => getComputedStyle(button)
    expect(radius(buttons[1]).borderTopLeftRadius).toBe('0px')
    expect(radius(buttons[1]).borderTopRightRadius).toBe('0px')
    expect(radius(buttons[0]).borderTopRightRadius).toBe('0px')
    expect(radius(buttons[0]).borderTopLeftRadius).not.toBe('0px')
    expect(radius(buttons[2]).borderTopRightRadius).not.toBe('0px')
    const [a, b] = buttons.map((button) => button.getBoundingClientRect())
    expect(Math.abs(b.left - a.right)).toBeLessThan(1)
  })
})

describe('flow', () => {
  it('a stack stretches a field to its width and leaves a button, a badge and a group at their own', async () => {
    const stack = document.createElement('gg-stack')
    stack.style.inlineSize = '480px'
    stack.innerHTML = `
      <gg-field label="Name"><input></gg-field>
      <gg-button><button>Save</button></gg-button>
      <gg-badge tone="ok">Done</gg-badge>
      <gg-button-group label="Align"><gg-button><button>Left</button></gg-button><gg-button><button>Right</button></gg-button></gg-button-group>`
    document.body.append(stack)
    await frames()
    const width = (selector: string) => stack.querySelector<HTMLElement>(selector)!.getBoundingClientRect().width
    expect(width('gg-field')).toBeCloseTo(480, 0)
    expect(width('gg-button')).toBeLessThan(120)
    expect(width('gg-badge')).toBeLessThan(120)
    expect(width('gg-button-group')).toBeLessThan(200)
    // The channel stops at the column's children: a button inside the group is not sent to its start.
    expect(getComputedStyle(stack.querySelector('gg-button-group button')!).alignSelf).not.toBe('start')
  })

  it('a grid falls to fewer columns as its frame narrows, with no breakpoint', async () => {
    const grid = document.createElement('gg-grid')
    grid.innerHTML = '<div>1</div><div>2</div><div>3</div><div>4</div>'
    document.body.append(grid)
    const columns = () => new Set([...grid.children].map((cell) => Math.round(cell.getBoundingClientRect().left))).size
    grid.style.inlineSize = '1100px'
    await frames()
    expect(columns()).toBe(4)
    grid.style.inlineSize = '560px'
    await frames()
    expect(columns()).toBe(2)
    grid.style.inlineSize = '240px'
    await frames()
    expect(columns()).toBe(1)
    expect(grid.firstElementChild!.getBoundingClientRect().width).toBeLessThanOrEqual(240)
  })

  it('a container keeps its ceiling and stands in the middle', async () => {
    const container = document.createElement('gg-container')
    container.setAttribute('size', 'narrow')
    container.innerHTML = '<p>Text</p>'
    document.body.append(container)
    await frames()
    const box = container.getBoundingClientRect()
    expect(box.width).toBeCloseTo(44 * 16, 0)
    expect(Math.abs(box.left - (document.documentElement.clientWidth - box.right))).toBeLessThan(1)
  })

  it('a page header puts its actions at the far edge, and under the title when there is no room', async () => {
    const header = document.createElement('gg-page-header')
    header.setAttribute('heading', 'Leads')
    header.setAttribute('description', 'Everyone the sales team is talking to.')
    header.innerHTML = '<gg-button slot="actions"><button>New lead</button></gg-button>'
    header.style.inlineSize = '900px'
    document.body.append(header)
    await frames()
    const actions = () => header.querySelector<HTMLElement>('[data-part="actions"]')!.getBoundingClientRect()
    const title = () => header.querySelector<HTMLElement>('[data-part="title"]')!.getBoundingClientRect()
    expect(Math.abs(actions().right - header.getBoundingClientRect().right)).toBeLessThan(1)
    expect(actions().top).toBeLessThan(title().bottom)
    header.style.inlineSize = '320px'
    await frames()
    expect(actions().top).toBeGreaterThan(title().bottom)
  })

  it('a section’s line stands under its heading, whatever the width', async () => {
    const section = document.createElement('gg-section')
    section.setAttribute('heading', 'Your details')
    section.setAttribute('description', 'Shown to the leads you write to.')
    section.style.inlineSize = '1000px'
    section.innerHTML = '<p>Body</p>'
    document.body.append(section)
    await frames()
    const title = section.querySelector('[data-part="title"]')!.getBoundingClientRect()
    const line = section.querySelector('[data-part="description"]')!.getBoundingClientRect()
    expect(line.top).toBeGreaterThanOrEqual(title.bottom - 1)
  })

  it('two sections stand farther apart than the rows inside one', async () => {
    const stackOf = (name: string) =>
      `<gg-section heading="${name}"><p style="margin:0">Row one</p><p style="margin:0">Row two</p></gg-section>`
    const box = document.createElement('div')
    box.innerHTML = stackOf('First') + stackOf('Second')
    document.body.append(box)
    await frames()
    const [first, second] = [...box.querySelectorAll('gg-section')]
    const rows = [...first.querySelectorAll('p')].map((row) => row.getBoundingClientRect())
    const inside = rows[1].top - rows[0].bottom
    const between = second.getBoundingClientRect().top - first.getBoundingClientRect().bottom
    expect(between).toBeGreaterThan(inside * 2)
  })
})
