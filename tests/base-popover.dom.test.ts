import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Popover, type PopoverProps } from '../packages/react/src/components/popover/Popover'
import { Dialog } from '../packages/react/src/components/dialog/Dialog'
import { openLayerCount } from '@ggary/core'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise((resolve) => setTimeout(resolve, 30))
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined
  expect(openLayerCount()).toBe(0)
  document.body.replaceChildren()
})
async function mount(props: Partial<PopoverProps> = {}, hosted = false) {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const render = async (next: Partial<PopoverProps> = {}) => {
    const child = h(Popover, { title: 'Preferences', trigger: (p) => h('button', p, 'Preferences'),
      children: h('input', { 'aria-label': 'Name' }), ...props, ...next })
    await act(async () => { root!.render(hosted ? h(Dialog, { defaultOpen: true, title: 'Host' }, child) : child); await settle() })
  }
  await render()
  return { render }
}
const popup = () => document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]')!
const trigger = () => document.querySelector<HTMLButtonElement>('[id^="gg-base-popover"][id$="-trigger"]')!
const escape = async () => act(async () => {
  document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await settle()
})
describe('Popover public Base UI integration', () => {
  it('controlled owners can refuse closing; prop changes emit no callback', async () => {
    const changed = vi.fn()
    const m = await mount({ open: true, onOpenChange: changed })
    await escape()
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'escape' })
    expect(popup().dataset.state).toBe('open')
    await m.render({ open: false })
    expect(popup().dataset.state).toBe('closed')
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('updated Escape options are respected without remounting', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultOpen: true, closeOnEscape: false, onOpenChange: changed })
    await escape()
    expect(changed).not.toHaveBeenCalled()
    await m.render({ closeOnEscape: true })
    await escape()
    expect(changed).toHaveBeenCalledExactlyOnceWith(false, { reason: 'escape' })
  })
  it('closing unmounts fields while preserving the hidden surface', async () => {
    await mount({ defaultOpen: true })
    expect(popup().querySelector('input')).not.toBeNull()
    await escape()
    expect(popup().querySelector('input')).toBeNull()
    expect(popup().parentElement!.hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(trigger())
  })
  it('a hosted popover belongs to the dialog layer outside its popup', async () => {
    await mount({ defaultOpen: true }, true)
    expect(popup().closest('[data-scope="dialog"][data-part="layer"]')).not.toBeNull()
    expect(popup().closest('[data-scope="dialog"][data-part="content"]')).toBeNull()
    await escape()
    expect(document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')!.dataset.state).toBe('open')
    expect(document.activeElement).toBe(trigger())
  })
})
