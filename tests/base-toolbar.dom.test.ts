import { afterEach, expect, it, vi } from 'vitest'
import { act, createElement as h } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toolbar, ToolbarButton, ToolbarSeparator } from '../packages/react/src/components/toolbar/Toolbar'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 30))
afterEach(async () => { await act(async () => { root?.unmount(); await settle() }); document.body.replaceChildren() })
async function mount(props = {}) {
 const host = document.createElement('div'); document.body.append(host); root = createRoot(host)
 const click = vi.fn(); let buttonRef: HTMLButtonElement | null = null
 await act(async () => { root!.render(h(Toolbar, { label: 'Tools', ...props, children: [
  h(ToolbarButton, { key: 'a', ref: element => { buttonRef = element }, onClick: click }, 'First'),
  h(ToolbarButton, { key: 'disabled', disabled: true }, 'Disabled'),
  h(ToolbarSeparator, { key: 'separator' }), h(ToolbarButton, { key: 'b' }, 'Last'),
 ] })); await settle() })
 return { host, click, ref: buttonRef as unknown as HTMLButtonElement, buttons: host.querySelectorAll('button') }
}
it.each([['horizontal', 'ArrowRight'], ['vertical', 'ArrowDown']])('Base UI owns %s roving focus and skips disabled buttons', async (orientation, key) => {
 const m = await mount({ orientation })
 expect(m.host.querySelector('[role=toolbar]')!.getAttribute('data-backend')).toBe('base-ui')
 expect(Array.from(m.buttons).filter(button => button.tabIndex === 0)).toHaveLength(1)
 await act(async () => { m.buttons[0].focus(); m.buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await settle() })
 expect(document.activeElement).toBe(m.buttons[2])
 await act(async () => { m.buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await settle() })
 expect(document.activeElement).toBe(m.buttons[0])
})
it('preserves ref, click and GGary visual attributes', async () => {
 const m = await mount()
 expect(m.ref).toBe(m.buttons[0]); expect(m.ref.dataset.scope).toBe('button')
 await act(async () => m.ref.click())
 expect(m.click).toHaveBeenCalledOnce()
})
it('unnamed strips retain ordinary native tab order', async () => {
 const m = await mount({ label: undefined })
 expect(m.host.querySelector('[role=toolbar]')).toBeNull()
 expect(m.buttons[0].tabIndex).toBe(0); expect(m.buttons[2].tabIndex).toBe(0)
})
