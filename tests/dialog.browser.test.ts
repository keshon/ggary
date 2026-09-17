import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import '../packages/structure/src/index.css'
import '../packages/elements/src/index'
import { Dialog } from '../packages/react/src/index'
import { openLayerCount } from '../packages/core/src/utils/dismissable'
import type { GgDialogElement, GgSelectElement } from '../packages/elements/src/index'

/**
 * What only a real browser can show about Dialog: the top layer, the inert
 * page, real keys and pointers, a native form close, and the dismiss stack
 * under real Escape presses. Conformance covers the contract in both
 * environments; these cover the platform the contract leans on.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  document.body.replaceChildren()
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

function mountElement(html: string) {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.append(host)
  return host.querySelector('gg-dialog') as GgDialogElement
}

const content = (host: Element) => host.querySelector('dialog') as HTMLDialogElement

describe('dialog in a real browser', () => {
  it('is modal while open — in the top layer, with the page inert — and a real Escape closes it once', async () => {
    const dialog = mountElement(`
      <button id="outside">Outside</button>
      <gg-dialog heading="Rename"><button slot="trigger">Open</button><input aria-label="Name"></gg-dialog>`)
    const onChange = vi.fn()
    dialog.addEventListener('openchange', (e) => onChange((e as CustomEvent).detail))

    await userEvent.click(dialog.querySelector('[slot="trigger"]')!)
    expect(content(dialog).matches(':modal')).toBe(true)
    expect(content(dialog).contains(document.activeElement)).toBe(true)

    // Tab as far as the dialog has stops and further: focus never reaches the page.
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      expect(document.getElementById('outside')!.matches(':focus')).toBe(false)
    }

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(content(dialog).open).toBe(false)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith({ open: false, reason: 'escape', returnValue: '' })
    expect(document.activeElement).toBe(dialog.querySelector('[slot="trigger"]'))
  })

  it('locks the page scroll while modal, and only while modal', async () => {
    const dialog = mountElement(`<div style="height: 3000px"></div><gg-dialog heading="Hi"></gg-dialog>`)
    const overflow = () => getComputedStyle(document.documentElement).overflow
    expect(overflow()).not.toBe('hidden')
    dialog.show()
    expect(overflow()).toBe('hidden')
    dialog.close()
    expect(overflow()).not.toBe('hidden')

    dialog.setAttribute('non-modal', '')
    dialog.show()
    expect(content(dialog).matches(':modal')).toBe(false)
    expect(overflow()).not.toBe('hidden')
    dialog.close()
  })

  it('is not clipped by an ancestor that hides overflow: the top layer needs no portal', async () => {
    const dialog = mountElement(`
      <div style="overflow: hidden; height: 4px; transform: translateZ(0)">
        <gg-dialog heading="Clipped?"><p style="height: 200px">Tall body</p></gg-dialog>
      </div>`)
    dialog.show()
    const box = content(dialog).getBoundingClientRect()
    expect(box.height).toBeGreaterThan(200)
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    expect(content(dialog).contains(hit)).toBe(true)
  })

  it('a real click on the backdrop closes it', async () => {
    const dialog = mountElement(`<gg-dialog heading="Backdrop"><p>Body</p></gg-dialog>`)
    dialog.show()
    // A position outside the dialog's own box lands on its ::backdrop.
    await userEvent.click(content(dialog), { position: { x: -20, y: -20 } })
    await settle()
    expect(content(dialog).open).toBe(false)
  })

  it('a <form method="dialog"> closes it — through state, not natively — and reports the button’s value', async () => {
    const dialog = mountElement(`
      <gg-dialog heading="Delete?">
        <p>Gone for good.</p>
        <footer><form method="dialog"><button value="cancel">Cancel</button><button value="delete">Delete</button></form></footer>
      </gg-dialog>`)
    const onChange = vi.fn()
    dialog.addEventListener('openchange', (e) => onChange((e as CustomEvent).detail))
    dialog.show()
    await userEvent.click([...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Delete')!)
    await settle()
    expect(content(dialog).open).toBe(false)
    expect(dialog.hasAttribute('open')).toBe(false)
    expect(onChange).toHaveBeenLastCalledWith({ open: false, reason: 'native', returnValue: 'delete' })
    expect(openLayerCount()).toBe(0)
  })

  it('React, controlled: a <form method="dialog"> asks like everything else, and can be refused', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onOpenChange = vi.fn()
    const footer = createElement('form', { method: 'dialog' }, createElement('button', { value: 'save' }, 'Save'))
    await act(async () => root.render(createElement(Dialog, { open: true, onOpenChange, title: 'Form', footer }, 'Body')))
    const el = host.querySelector('dialog')!
    await userEvent.click(host.querySelector('button[value="save"]')!)
    await act(async () => settle())
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'native', returnValue: 'save' })
    expect(el.open).toBe(true)
    expect(el.returnValue).toBe('save')
    await act(async () => root.unmount())
  })

  it('a select inside a dialog takes the first Escape; the dialog the second', async () => {
    const dialog = mountElement(`<gg-dialog heading="Pick"><gg-select label="Plan"></gg-select></gg-dialog>`)
    const select = dialog.querySelector('gg-select') as GgSelectElement
    select.items = [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ]
    dialog.show()
    const trigger = select.querySelector('[data-part="trigger"]') as HTMLElement
    await userEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(openLayerCount()).toBe(2)

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(content(dialog).open).toBe(true)

    await userEvent.keyboard('{Escape}')
    await settle()
    expect(content(dialog).open).toBe(false)
    expect(openLayerCount()).toBe(0)
  })

  it('React, controlled: an owner that refuses a close keeps it open, and hears every request', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const onOpenChange = vi.fn()
    await act(async () => root.render(createElement(Dialog, { open: true, onOpenChange, title: 'Stay' }, 'Body')))
    const el = host.querySelector('dialog')!
    expect(el.matches(':modal')).toBe(true)

    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard('{Escape}')
    await act(async () => settle())
    expect(el.open).toBe(true)
    expect(el.matches(':modal')).toBe(true)
    expect(onOpenChange.mock.calls).toEqual([
      [false, { reason: 'escape' }],
      [false, { reason: 'escape' }],
    ])
    await act(async () => root.unmount())
  })
})
