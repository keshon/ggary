import { afterEach, expect, it } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Avatar } from '../packages/react/src/components/avatar/Avatar'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
it('preserves accessible names and initials without an image', async () => {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 await act(async () => root!.render(h(Avatar, { name: 'Ada Lovelace' })))
 const avatar = host.querySelector('[data-part=root]')!
 expect(avatar.getAttribute('aria-label')).toBe('Ada Lovelace')
 expect(avatar.getAttribute('data-status')).toBe('none')
 expect(host.textContent).toBe('AL')
})
it('Base UI owns load/error and restarts fallback when the source changes', async () => {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 const render = async (src?: string) => act(async () => { root!.render(h(Avatar, { name: 'Ada Lovelace', src })); await settle() })
 await render('/first.png')
 const avatar = () => host.querySelector('[data-part=root]')!
 expect(avatar().getAttribute('data-status')).toBe('loading')
 await act(async () => { host.querySelector('img')!.dispatchEvent(new Event('load')); await settle() })
 expect(avatar().getAttribute('data-status')).toBe('loaded')
 await render('/second.png')
 expect(avatar().getAttribute('data-status')).toBe('loading')
 await act(async () => { host.querySelector('img')!.dispatchEvent(new Event('error')); await settle() })
 expect(avatar().getAttribute('data-status')).toBe('error')
 expect(host.textContent).toBe('AL')
 await render('/third.png')
 await act(async () => { host.querySelector('img')!.dispatchEvent(new Event('load')); await settle() })
 await render(undefined)
 expect(host.textContent).toBe('AL')
})
