import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Dialog as BaseDialog } from '../packages/react/src/components/dialog/Dialog'
import type { DialogProps } from '../packages/react/src/components/dialog/Dialog'
import { openLayerCount } from '@ggary/core'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
afterEach(async () => {
  await act(async () => { root?.unmount(); await new Promise((resolve) => setTimeout(resolve, 30)) })
  root = undefined
  expect(openLayerCount()).toBe(0)
  document.body.replaceChildren()
})
async function mount(props: DialogProps = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const render = async (next: DialogProps = {}) => {
    await act(async () => root!.render(createElement(BaseDialog, {
      title: 'Pilot', trigger: (p) => createElement('button', p, 'Open pilot'), ...props, ...next,
    })))
  }
  await render()
  return { render, trigger: () => host.querySelector<HTMLButtonElement>('button')! }
}
const popup = () => document.querySelector('[data-backend="base-ui"][data-part="content"]')
const escape = async () => { await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))) }

describe('Dialog public Base UI contract', () => {
  it('opens once and reports the existing trigger/escape reasons', async () => {
    const changed = vi.fn()
    const m = await mount({ onOpenChange: changed })
    await act(async () => { m.trigger().focus(); m.trigger().click() })
    expect(popup()).not.toBeNull()
    expect(changed.mock.calls).toEqual([[true, { reason: 'trigger' }]])
    await escape()
    expect(changed.mock.calls).toEqual([[true, { reason: 'trigger' }], [false, { reason: 'escape' }]])
  })
  it('controlled refusal keeps the dialog open; prop synchronization emits no callback', async () => {
    const changed = vi.fn()
    const m = await mount({ open: true, onOpenChange: changed })
    await escape()
    expect(popup()).not.toBeNull()
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'escape' })
    await m.render({ open: false })
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('persistent dialogs refuse Escape without reporting a close', async () => {
    const changed = vi.fn()
    await mount({ defaultOpen: true, closeOnEscape: false, onOpenChange: changed })
    await escape()
    expect(popup()).not.toBeNull()
    expect(changed).not.toHaveBeenCalled()
  })
  it('description is rendered and linked even without a title or close button', async () => {
    await mount({ defaultOpen: true, title: null, closeButton: false, description: 'Description only' })
    const description = document.querySelector('[data-part="description"]')!
    expect(description.textContent).toBe('Description only')
    expect(popup()?.getAttribute('aria-describedby')).toBe(description.id)
  })
  it.each([false, true])('method="dialog" reports the submitter and respects controlled refusal (%s)', async (controlled) => {
    const changed = vi.fn()
    const footer = createElement('form', { method: 'dialog' }, createElement('button', { value: 'save' }, 'Save'))
    await mount({ defaultOpen: true, ...(controlled ? { open: true } : {}), onOpenChange: changed, footer })
    const form = popup()!.querySelector('form')!
    await act(async () => form.requestSubmit(form.querySelector('button')!))
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'native', returnValue: 'save' })
    expect(popup()?.getAttribute('data-state')).toBe(controlled ? 'open' : 'closed')
  })
  it('respects a cancelled submit and a submitter formmethod override', async () => {
    const changed = vi.fn()
    const footer = createElement('form', { method: 'post', onSubmit: (e: { preventDefault(): void }) => e.preventDefault() },
      createElement('button', { formMethod: 'dialog', value: 'cancel' }, 'Cancel'))
    const m = await mount({ defaultOpen: true, onOpenChange: changed, footer })
    const submit = async () => { const form = popup()!.querySelector('form')!; await act(async () => form.requestSubmit(form.querySelector('button')!)) }
    await submit()
    expect(changed).not.toHaveBeenCalled()
    await m.render({ footer: createElement('form', { method: 'post' }, createElement('button', { formMethod: 'dialog', value: 'override' }, 'Override')) })
    await submit()
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'native', returnValue: 'override' })
  })
  it('keeps a hidden closed surface without mounting its body', async () => {
    await mount({ children: createElement('input', { name: 'secret' }) })
    expect(popup()?.hasAttribute('hidden')).toBe(true)
    expect(popup()?.querySelector('input')).toBeNull()
  })

})
