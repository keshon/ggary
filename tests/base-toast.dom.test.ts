import { afterEach, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toaster, createToaster } from '../packages/react/src/index'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function mount(queue = createToaster()) {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 await act(async () => { root!.render(h(Toaster, { toaster: queue })); await settle() })
 return queue
}
const toasts = () => Array.from(document.querySelectorAll<HTMLElement>('[data-scope=toast][data-part=toast]'))
it('flushes commands made before mounting and preserves ID updates', async () => {
 const queue = createToaster(); const id = queue.toast({ title: 'Saving', duration: 0 })
 queue.update(id, { title: 'Saved', tone: 'ok', duration: 0 })
 await mount(queue)
 expect(toasts()).toHaveLength(1); expect(toasts()[0].textContent).toContain('Saved')
 expect(toasts()[0].dataset.tone).toBe('ok')
 await act(async () => { queue.toast({ id, title: 'Changed', duration: 0 }); await settle() })
 expect(toasts()).toHaveLength(1); expect(toasts()[0].textContent).toContain('Changed')
})
it('Base UI runs timeout expiry while error defaults remain persistent', async () => {
 const queue = await mount()
 await act(async () => { queue.toast({ title: 'Temporary', duration: 80 }); queue.toast({ title: 'Error', tone: 'error' }); await settle() })
 await act(async () => { await new Promise(resolve => setTimeout(resolve, 200)) })
 expect(toasts().some(toast => toast.textContent?.includes('Temporary') && toast.dataset.state === 'open')).toBe(false)
 expect(toasts().some(toast => toast.textContent?.includes('Error') && toast.dataset.state === 'open')).toBe(true)
})
it('actions run once and dismiss their toast', async () => {
 const queue = await mount(); const clicked = vi.fn()
 await act(async () => { queue.toast({ title: 'Deleted', duration: 0, action: { label: 'Undo', onClick: clicked } }); await settle() })
 await act(async () => { document.querySelector<HTMLButtonElement>('[data-part=action]')!.click(); await settle() })
 expect(clicked).toHaveBeenCalledOnce()
 expect(toasts().length === 0 || toasts()[0].dataset.state === 'leaving').toBe(true)
})
it('max uses Base UI limited state, and dismiss-all closes the active queue', async () => {
 const queue = await mount(createToaster({ max: 2 }))
 await act(async () => { for (let i = 0; i < 3; i++) queue.toast({ title: `Toast ${i}`, duration: 0 }); await settle() })
 expect(toasts().filter(toast => toast.style.display !== 'none')).toHaveLength(2)
 await act(async () => { queue.dismiss(); await settle() })
 expect(toasts().every(toast => toast.dataset.state === 'leaving')).toBe(true)
})

it.each(['hover', 'focus'])('Base UI pauses expiry during %s interaction', async mode => {
 const queue = await mount()
 await act(async () => { queue.toast({ title: 'Read this', duration: 100, action: { label: 'Action', onClick: () => {} } }); await settle() })
 const viewport = document.querySelector<HTMLElement>('[data-part=region]')!
 await act(async () => {
  if (mode === 'hover') viewport.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }))
  else document.querySelector<HTMLButtonElement>('[data-part=action]')!.focus()
  await new Promise(resolve => setTimeout(resolve, 180))
 })
 expect(toasts().some(toast => toast.dataset.state === 'open')).toBe(true)
})
