import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from '@vitest/browser/context'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'
import { createToaster } from '../packages/core/src/components/toast'
import type { GgToasterElement } from '../packages/elements/src/index'

/**
 * Toast where only a browser answers: the region in a corner of the viewport,
 * in the top layer, letting presses through where there is no toast; a real
 * pointer resting on a toast holding it; and the keyboard reaching its action.
 */
afterEach(() => {
  document.body.replaceChildren()
})

const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mountToaster(placement = 'bottom-end') {
  const toaster = createToaster()
  const host = document.createElement('gg-toaster') as GgToasterElement
  host.toaster = toaster
  host.setAttribute('placement', placement)
  document.body.append(host)
  const region = host.querySelector('[data-part="region"]') as HTMLElement
  return { toaster, host, region }
}

describe('toast in a real browser', () => {
  it('stands in its corner of the viewport, in the top layer, over a clipping ancestor', async () => {
    await page.viewport(800, 600)
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position: relative; overflow: hidden; width: 50px; height: 50px'
    document.body.append(wrapper)
    const { toaster, host, region } = mountToaster('bottom-end')
    wrapper.append(host)
    toaster.toast({ title: 'Saved', duration: 0 })
    await settle(50)
    expect(region.matches(':popover-open')).toBe(true)
    const toast = host.querySelector('[data-part="toast"]')!.getBoundingClientRect()
    expect(Math.round(toast.right)).toBe(800 - 16)
    expect(Math.round(toast.bottom)).toBe(600 - 16)
    const hit = document.elementFromPoint(toast.left + toast.width / 2, toast.top + toast.height / 2)
    expect(host.querySelector('[data-part="toast"]')!.contains(hit)).toBe(true)
  })

  it('an empty stretch of the region lets presses through to the page', async () => {
    await page.viewport(800, 600)
    const button = document.createElement('button')
    button.textContent = 'Under the region'
    button.style.cssText = 'position: fixed; right: 20px; bottom: 300px'
    document.body.append(button)
    const { region } = mountToaster('bottom-end')
    region.style.blockSize = '400px'
    let pressed = false
    button.addEventListener('click', () => (pressed = true))
    await userEvent.click(button)
    expect(pressed).toBe(true)
  })

  it('a real pointer resting on a toast holds it; moving away lets it go', async () => {
    const { toaster, host } = mountToaster()
    // Durations with room for the round trip a real pointer move takes under load.
    toaster.toast({ title: 'Read me', duration: 800 })
    await settle(30)
    const toast = host.querySelector('[data-part="toast"]') as HTMLElement
    await userEvent.hover(toast)
    await settle(1200)
    expect(toast.dataset.state).toBe('open')
    await userEvent.unhover(toast)
    await settle(1100)
    expect(toast.dataset.state).toBe('leaving')
  })

  it('the keyboard reaches the action, which acts and dismisses', async () => {
    const { toaster, host } = mountToaster()
    let undone = false
    const before = document.createElement('button')
    before.textContent = 'Before'
    document.body.prepend(before)
    toaster.toast({ title: 'Deleted', duration: 0, action: { label: 'Undo', onClick: () => (undone = true) } })
    await settle(30)
    before.focus()
    await userEvent.tab()
    const action = host.querySelector('[data-part="action"]') as HTMLElement
    expect(document.activeElement).toBe(action)
    await userEvent.keyboard('{Enter}')
    expect(undone).toBe(true)
    expect(host.querySelector('[data-part="toast"]')!.getAttribute('data-state')).toBe('leaving')
  })
})
