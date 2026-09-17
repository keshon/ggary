import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import '../packages/theme-ggarry/src/index.css'
import '../packages/elements/src/index'

/**
 * What only a browser answers about the navigation components: the real Tab and
 * arrow keys on a toolbar, and the separators that are drawn but never read.
 */
afterEach(() => {
  document.body.replaceChildren()
})

const mount = (html: string) => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host
}

const part = (root: Element, scope: string, name: string) =>
  root.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!

describe('toolbar in a real browser', () => {
  const strip = `
    <button id="before">Before</button>
    <gg-toolbar label="Tools">
      <button type="button">Move</button>
      <button type="button">Rotate</button>
      <button type="button" disabled>Scale</button>
      <span data-separator></span>
      <button type="button">Snap</button>
    </gg-toolbar>
    <button id="after">After</button>`

  it('is one tab stop, and the arrows walk it, skipping what cannot be used', async () => {
    const host = mount(strip)
    const buttons = [...host.querySelectorAll('gg-toolbar button')] as HTMLButtonElement[]
    ;(host.querySelector('#before') as HTMLElement).focus()

    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0])

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[1])
    // Scale is disabled: the arrows step over it rather than landing on it.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[3])

    // A strip has two ends and no beginning to get stuck against.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(buttons[3])

    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(buttons[3])

    // One stop for the strip: Tab leaves it rather than walking the tools.
    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
  })

  it('comes back to the tool last used, which is what a toolbar is for', async () => {
    const host = mount(strip)
    const buttons = [...host.querySelectorAll('gg-toolbar button')] as HTMLButtonElement[]
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(buttons[1])

    await userEvent.tab()
    expect(document.activeElement).toBe(host.querySelector('#after'))
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(buttons[1])
  })

  it('the spacer pushes the tail to the far edge of the strip', () => {
    const host = mount(`
      <gg-toolbar label="Tools" style="width: 400px">
        <button type="button">One</button>
        <span data-separator></span>
        <button type="button">Two</button>
        <span data-spacer></span>
        <span id="tail">Saved</span>
      </gg-toolbar>`)
    const strip = host.querySelector('gg-toolbar')!
    const tail = host.querySelector('#tail')!
    const inset = parseFloat(getComputedStyle(strip).paddingInlineEnd)
    expect(tail.getBoundingClientRect().right).toBeCloseTo(strip.getBoundingClientRect().right - inset, 0)
  })

  it('a field inside the strip keeps its own arrows: they move the caret', async () => {
    const host = mount(`
      <gg-toolbar label="Filters">
        <button type="button">All</button>
        <gg-search><input type="search" value="worldgen"></gg-search>
      </gg-toolbar>`)
    const input = host.querySelector('input')!
    input.focus()
    input.setSelectionRange(5, 5)
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(4)
  })

  it('an unnamed strip promises nothing: every tool keeps its own tab stop', async () => {
    const host = mount(`
      <button id="before">Before</button>
      <gg-toolbar>
        <button type="button">One</button>
        <button type="button">Two</button>
      </gg-toolbar>`)
    const buttons = [...host.querySelectorAll('gg-toolbar button')] as HTMLButtonElement[]
    ;(host.querySelector('#before') as HTMLElement).focus()
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[0])
    await userEvent.tab()
    expect(document.activeElement).toBe(buttons[1])
  })
})

describe('breadcrumbs and steps in a real browser', () => {
  it('the chevron between crumbs is drawn, and is in neither the text nor the tree', () => {
    const host = mount(`
      <gg-breadcrumbs label="Breadcrumbs">
        <a href="#a">Projects</a>
        <a href="#b">worldgen</a>
        <span>Run #4127</span>
      </gg-breadcrumbs>`)
    const crumbs = host.querySelector('gg-breadcrumbs')!
    const second = [...crumbs.querySelectorAll('[data-part="item"]')][1]
    const drawn = getComputedStyle(second, '::before')
    expect(drawn.maskImage === 'none' ? drawn.webkitMaskImage : drawn.maskImage).toContain('url(')
    // The path carries no separator character: a screen reader reads the crumbs,
    // not a line of angle brackets, and neither does a copy of it.
    expect(crumbs.textContent).not.toMatch(/[>\/›❯]/)
    expect([...crumbs.querySelectorAll('[data-part="item"]')].map((item) => item.textContent)).toEqual([
      'Projects',
      'worldgen',
      'Run #4127',
    ])
  })

  it('a step’s bar spans its whole item, so it cannot part from the label', () => {
    const host = mount(`
      <gg-steps label="Import">
        <div data-state="done">Source</div>
        <div data-state="current">Check</div>
        <div data-state="todo">Launch</div>
      </gg-steps>`)
    const items = [...host.querySelectorAll('[data-scope="steps"][data-part="item"]')] as HTMLElement[]
    for (const item of items) {
      const bar = getComputedStyle(item, '::before')
      expect(bar.content).not.toBe('none')
      expect(parseFloat(bar.width)).toBeCloseTo(item.getBoundingClientRect().width, 0)
    }
    // Done and current share the reached colour; the one to come does not.
    const colour = (item: HTMLElement) => getComputedStyle(item, '::before').backgroundColor
    expect(colour(items[0])).toBe(colour(items[1]))
    expect(colour(items[2])).not.toBe(colour(items[1]))
  })

  it('a spent page takes no pointer, and the words of the path are not links', () => {
    const host = mount(`
      <gg-pagination label="Pages">
        <a href="#p7" aria-disabled="true">Back</a>
        <a href="#p8" aria-current="page">8</a>
        <span>…</span>
      </gg-pagination>`)
    const back = part(host.querySelector('gg-pagination')!, 'pagination', 'link')
    expect(getComputedStyle(back).pointerEvents).toBe('none')
  })
})
