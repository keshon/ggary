import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Menu, type MenuProps } from '../packages/react/src/components/menu/Menu'
import { Dialog } from '../packages/react/src/components/dialog/Dialog'
import { openLayerCount } from '@ggary/core'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise((r) => setTimeout(r, 30))
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined
  expect(openLayerCount()).toBe(0)
  document.body.replaceChildren()
})
async function mount(props: Partial<MenuProps> = {}, hosted = false) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const render = async (next: Partial<MenuProps> = {}) => {
    const child = h(Menu, { items: [{ value: 'edit', label: 'Edit' }],
      trigger: (p) => h('button', p, 'Actions'), ...props, ...next })
    await act(async () => { root!.render(hosted ? h(Dialog, { defaultOpen: true, title: 'Host' }, child) : child); await settle() })
  }
  await render()
  return { render }
}
const popup = () => document.querySelector<HTMLElement>('[data-scope="menu"][data-part="content"]')!
const escape = () => act(async () => {
  document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await settle()
})
const activate = (role: string) => act(async () => {
  (document.querySelector(`[role="${role}"]`) as HTMLElement).click()
  await settle()
})
describe('Menu public Base UI integration', () => {
  it('controlled owners can refuse Escape; prop changes emit no callbacks', async () => {
    const changed = vi.fn()
    const m = await mount({ open: true, onOpenChange: changed })
    await escape()
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'escape' })
    expect(popup().dataset.state).toBe('open')
    await m.render({ open: false })
    expect(popup().dataset.state).toBe('closed')
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('checkbox state belongs to the owner, including repeated refused requests', async () => {
    const chosen = vi.fn()
    const entry = { type: 'checkbox' as const, value: 'grid', label: 'Grid', checked: false }
    const m = await mount({ defaultOpen: true, items: [entry], closeOnSelect: false, onSelect: chosen })
    await activate('menuitemcheckbox')
    await activate('menuitemcheckbox')
    expect(chosen.mock.calls).toEqual([['grid', { item: entry, checked: true }], ['grid', { item: entry, checked: true }]])
    expect(document.querySelector('[role="menuitemcheckbox"]')!.getAttribute('aria-checked')).toBe('false')
    await m.render({ items: [{ ...entry, checked: true }] })
    expect(document.querySelector('[role="menuitemcheckbox"]')!.getAttribute('aria-checked')).toBe('true')
  })
  it('already-selected radio still reports activation once', async () => {
    const chosen = vi.fn()
    const entry = { type: 'radio' as const, value: 'compact', label: 'Compact', checked: true }
    await mount({ defaultOpen: true, items: [entry], closeOnSelect: false, onSelect: chosen })
    await activate('menuitemradio')
    expect(chosen).toHaveBeenCalledExactlyOnceWith('compact', { item: entry, checked: true })
  })
  it('hosted menus remain inside the dialog layer; Escape leaves the dialog open', async () => {
    await mount({ defaultOpen: true }, true)
    expect(popup().closest('[data-scope="dialog"][data-part="layer"]')).not.toBeNull()
    expect(popup().closest('[data-scope="dialog"][data-part="content"]')).toBeNull()
    await escape()
    expect(document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')!.dataset.state).toBe('open')
  })
})
