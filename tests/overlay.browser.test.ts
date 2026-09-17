import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'
import { coolDownTooltips } from '../packages/core/src/components/tooltip/tooltip.machine'
import { openLayerCount } from '../packages/core/src/utils/dismissable'
import type { GgDialogElement, GgPopoverElement } from '../packages/elements/src/index'

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
