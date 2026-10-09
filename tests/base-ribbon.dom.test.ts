import { afterAll, afterEach, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Ribbon, RibbonGroup } from '../packages/react/src/components/ribbon/Ribbon'
import { ToolbarButton } from '../packages/react/src/components/toolbar/Toolbar'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
afterAll(() => vi.unstubAllGlobals())
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
const items = [{ value: 'create', label: 'Create' }, { value: 'edit', label: 'Edit' }, { value: 'disabled', label: 'Disabled', disabled: true }]
async function mount(props = {}) {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 await act(async () => { root!.render(h(Ribbon, { items, ...props, children: item => h(RibbonGroup, { label: item.label, children: [h(ToolbarButton, { key: 'first' }, 'First'), h(ToolbarButton, { key: 'last' }, 'Last')] }) })); await settle() })
 return host
}
it('Base UI owns tab selection and groups own registered arrow navigation', async () => {
 const host = await mount(); const tabs = host.querySelectorAll<HTMLElement>('[role=tab]')
 await act(async () => { tabs[0].focus(); tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await settle() })
 expect(tabs[1].getAttribute('aria-selected')).toBe('true')
 const toolbar = host.querySelector('[role=toolbar]')!
 const buttons = toolbar.querySelectorAll('button')
 await act(async () => { buttons[0].focus(); buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await settle() })
 expect(document.activeElement).toBe(buttons[1])
})
it('controlled owners can refuse selection and keep mounted panel state', async () => {
 const changed = vi.fn(); const host = await mount({ value: 'create', onValueChange: changed, keepMounted: true })
 await act(async () => { host.querySelectorAll<HTMLElement>('[role=tab]')[1].click(); await settle() })
 expect(changed).toHaveBeenCalledWith('edit')
 expect(host.querySelector('[data-value=create][role=tab]')!.getAttribute('aria-selected')).toBe('true')
 expect(host.querySelectorAll('[role=tabpanel]')).toHaveLength(3)
})
it('mixed control groups are ordinary named groups without toolbar behavior', async () => {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 await act(async () => root!.render(h(RibbonGroup, { label: 'Options', managed: false, children: h('input', { 'aria-label': 'Option' }) })))
 expect(host.querySelector('[role=toolbar]')).toBeNull()
 expect(host.querySelector('[role=group]')!.getAttribute('aria-label')).toBe('Options')
})
