import { afterEach, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Shell } from '../packages/react/src/components/layout/Shell'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
const originalMatchMedia = window.matchMedia
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined; window.matchMedia = originalMatchMedia; vi.restoreAllMocks(); document.body.replaceChildren()
})
async function mount(props = {}) {
  const media = new EventTarget() as EventTarget & { matches: boolean }
  media.matches = true
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: vi.fn(() => media) })
  const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
  await act(async () => {
    root!.render(h(Shell, { aside: h('input', { defaultValue: 'draft', 'aria-label': 'Draft' }), children: h('button', null, 'Work'), ...props })); await settle()
  })
  return { host, resize: async (narrow: boolean) => act(async () => { media.matches = narrow; media.dispatchEvent(new Event('change')); await settle() }) }
}
it('preserves sidebar DOM and draft across mobile dismissal and desktop resizing', async () => {
  const changed = vi.fn(); const { host, resize } = await mount({ defaultOpen: true, onOpenChange: changed })
  const input = host.querySelector<HTMLInputElement>('input')!; input.value = 'edited'
  await resize(false)
  expect(changed).toHaveBeenLastCalledWith(false, { reason: 'resize' })
  expect(host.querySelector('input')).toBe(input)
  expect(input.closest('[data-part=aside]')!.getAttribute('role')).toBe('complementary')
  expect(input.closest('[data-part=aside]')!.hasAttribute('hidden')).toBe(false)
  await resize(true)
  expect(input.closest('[data-part=aside]')!.hasAttribute('hidden')).toBe(true)
  await act(async () => { host.querySelector<HTMLButtonElement>('[data-part=toggle]')!.click(); await settle() })
  expect(host.querySelector('input')).toBe(input)
  expect(input.value).toBe('edited')
})
it('controlled owners can refuse Escape without losing the open drawer', async () => {
  const changed = vi.fn(); const { host } = await mount({ open: true, onOpenChange: changed })
  await act(async () => {
    host.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await settle()
  })
  expect(changed).toHaveBeenCalledWith(false, { reason: 'escape' })
  expect(host.querySelector('[data-part=aside]')!.hasAttribute('hidden')).toBe(false)
})
