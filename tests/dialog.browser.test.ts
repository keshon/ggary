import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import '../packages/structure/src/index.css'
import { Dialog, Select, type DialogProps } from '../packages/react/src/index'
import { openLayerCount } from '../packages/core/src/utils/dismissable'

/**
 * What only a real browser can show about Dialog: the top layer, the inert
 * page, real keys and pointers, a native form close, and the dismiss stack
 * under real Escape presses. Conformance covers the contract in both
 * environments; these cover the platform the contract leans on.
 */
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  document.body.replaceChildren()
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

/** Renders a Dialog, with whatever stands around it; `render` re-renders it with new props. */
async function mountDialog(props: DialogProps, around: (dialog: ReactNode) => ReactNode = (dialog) => dialog) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const render = (next: DialogProps) => act(async () => root!.render(around(createElement(Dialog, next))))
  await render(props)
  const content = () => host.querySelector('dialog') as HTMLDialogElement
  return { host, content, render }
}

describe('dialog in a real browser', () => {
  it('is modal while open — in the top layer, with the page inert — and a real Escape closes it once', async () => {
    const onOpenChange = vi.fn()
    const { host, content } = await mountDialog(
      {
        title: 'Rename',
        onOpenChange,
        trigger: (props) => createElement('button', props, 'Open'),
        children: createElement('input', { 'aria-label': 'Name' }),
      },
      (dialog) => [createElement('button', { key: 'outside', id: 'outside' }, 'Outside'), createElement('div', { key: 'dialog' }, dialog)]
    )
    const trigger = [...host.querySelectorAll('button')].find((b) => b.textContent === 'Open')!

    await userEvent.click(trigger)
    await act(async () => settle())
    expect(content().matches(':modal')).toBe(true)
    expect(content().contains(document.activeElement)).toBe(true)

    // Tab as far as the dialog has stops and further: focus never reaches the page.
    for (let i = 0; i < 5; i++) {
      await userEvent.tab()
      expect(document.getElementById('outside')!.matches(':focus')).toBe(false)
    }

    await userEvent.keyboard('{Escape}')
    await act(async () => settle())
    expect(content().open).toBe(false)
    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
    expect(document.activeElement).toBe(trigger)
  })

  it('locks the page scroll while modal, and only while modal', async () => {
    const overflow = () => getComputedStyle(document.documentElement).overflow
    const { content, render } = await mountDialog({ title: 'Hi', open: false }, (dialog) => [
      createElement('div', { key: 'tall', style: { height: 3000 } }),
      createElement('div', { key: 'dialog' }, dialog),
    ])
    expect(overflow()).not.toBe('hidden')
    await render({ title: 'Hi', open: true })
    expect(overflow()).toBe('hidden')
    await render({ title: 'Hi', open: false })
    expect(overflow()).not.toBe('hidden')

    await render({ title: 'Hi', open: true, modal: false })
    expect(content().open).toBe(true)
    expect(content().matches(':modal')).toBe(false)
    expect(overflow()).not.toBe('hidden')
    await render({ title: 'Hi', open: false, modal: false })
  })

  it('is not clipped by an ancestor that hides overflow: the top layer needs no portal', async () => {
    const { content } = await mountDialog(
      { title: 'Clipped?', defaultOpen: true, children: createElement('p', { style: { height: 200 } }, 'Tall body') },
      (dialog) => createElement('div', { style: { overflow: 'hidden', height: 4, transform: 'translateZ(0)' } }, dialog)
    )
    const box = content().getBoundingClientRect()
    expect(box.height).toBeGreaterThan(200)
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    expect(content().contains(hit)).toBe(true)
  })

  it('a real click on the backdrop closes it', async () => {
    const { content } = await mountDialog({ title: 'Backdrop', defaultOpen: true, children: createElement('p', null, 'Body') })
    // A position outside the dialog's own box lands on its ::backdrop.
    await userEvent.click(content(), { position: { x: -20, y: -20 } })
    await act(async () => settle())
    expect(content().open).toBe(false)
  })

  it('a <form method="dialog"> closes it — through state, not natively — and reports the button’s value', async () => {
    const onOpenChange = vi.fn()
    const footer = createElement(
      'form',
      { method: 'dialog' },
      createElement('button', { key: 'cancel', value: 'cancel' }, 'Cancel'),
      createElement('button', { key: 'delete', value: 'delete' }, 'Delete')
    )
    const { host, content } = await mountDialog({ title: 'Delete?', defaultOpen: true, onOpenChange, footer, children: createElement('p', null, 'Gone for good.') })
    await userEvent.click([...host.querySelectorAll('button')].find((b) => b.textContent === 'Delete')!)
    await act(async () => settle())
    expect(content().open).toBe(false)
    expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'native', returnValue: 'delete' })
    expect(openLayerCount()).toBe(0)
  })

  it('React, controlled: a <form method="dialog"> asks like everything else, and can be refused', async () => {
    const onOpenChange = vi.fn()
    const footer = createElement('form', { method: 'dialog' }, createElement('button', { value: 'save' }, 'Save'))
    const { host, content } = await mountDialog({ open: true, onOpenChange, title: 'Form', footer, children: 'Body' })
    const el = content()
    await userEvent.click(host.querySelector('button[value="save"]')!)
    await act(async () => settle())
    expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'native', returnValue: 'save' })
    expect(el.open).toBe(true)
    expect(el.returnValue).toBe('save')
  })

  it('a select inside a dialog takes the first Escape; the dialog the second', async () => {
    const items = [
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ]
    const { host, content } = await mountDialog({ title: 'Pick', defaultOpen: true, children: createElement(Select, { label: 'Plan', items }) })
    const trigger = host.querySelector('[data-scope="select"][data-part="trigger"]') as HTMLElement
    await userEvent.click(trigger)
    await act(async () => settle())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(openLayerCount()).toBe(2)

    await userEvent.keyboard('{Escape}')
    await act(async () => settle())
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(content().open).toBe(true)

    await userEvent.keyboard('{Escape}')
    await act(async () => settle())
    expect(content().open).toBe(false)
    expect(openLayerCount()).toBe(0)
  })

  it('React, controlled: an owner that refuses a close keeps it open, and hears every request', async () => {
    const onOpenChange = vi.fn()
    const { content } = await mountDialog({ open: true, onOpenChange, title: 'Stay', children: 'Body' })
    const el = content()
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
  })
})
