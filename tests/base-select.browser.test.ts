import { afterEach, describe, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ConfigProvider, Dialog, Popover, Sheet } from '../packages/react/src/index'
import { Select as BaseSelect } from '../packages/react/src/components/select/Select'
import type { SelectProps } from '../packages/react/src/components/select/Select'
import { openLayerCount } from '../packages/core/src/utils/dismissable'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; document.body.replaceChildren(); expect(openLayerCount()).toBe(0) })
const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }, { value: 'c', label: 'Charlie', disabled: true }]
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)) })
async function mount(props: Partial<SelectProps> = {}, overlay?: 'dialog' | 'sheet' | 'popover') {
  const form = document.createElement('form')
  document.body.append(form)
  root = createRoot(form)
  const render = async (next: Partial<SelectProps> = {}) => act(async () => {
    const select = createElement(BaseSelect, { items, label: 'Stage', name: 'stage', ...props, ...next })
    root!.render(overlay === 'popover'
      ? createElement(Popover, { title: 'Edit', defaultOpen: true, trigger: (props) => createElement('button', props, 'Open') }, select)
      : overlay ? createElement(overlay === 'dialog' ? Dialog : Sheet, { title: 'Edit', defaultOpen: true }, select) : select)
  })
  await render()
  const trigger = () => (overlay && overlay !== 'popover' ? document : form).querySelector<HTMLButtonElement>('[data-scope="select"][data-part="trigger"]')!
  const option = (label: string) => Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find((item) => item.textContent === label)!
  const open = async () => { trigger().focus(); await userEvent.keyboard('{Enter}'); await settle() }
  return { form, render, trigger, option, open }
}
describe('BaseSelect real browser integration', () => {
  it('inherits an isolated provider theme and RTL direction while open', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    await act(async () => root!.render(createElement(ConfigProvider, { mode: 'dark', dir: 'rtl' },
      createElement(BaseSelect, { label: 'Stage', items, defaultValue: 'a' }))))
    const trigger = host.querySelector<HTMLButtonElement>('[data-part="trigger"]')!
    await userEvent.click(trigger)
    await settle()
    const popup = host.querySelector<HTMLElement>('[data-part="content"]')!
    expect(popup.closest('[data-scope="config-provider"]')).toBeTruthy()
    expect(getComputedStyle(popup).direction).toBe('rtl')
    expect(getComputedStyle(popup).backgroundColor).toBe(getComputedStyle(trigger).backgroundColor)
  })
  it('Escape closes a select before its legacy Popover, without leaking the layer bridge', async () => {
    const m = await mount({ defaultValue: 'a' }, 'popover')
    await m.open()
    expect(openLayerCount()).toBe(0)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(openLayerCount()).toBe(0)
    expect(m.trigger().getAttribute('aria-expanded')).toBe('false')
    expect(m.form.querySelector('[data-scope="popover"][data-part="content"]')).toBeTruthy()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(openLayerCount()).toBe(0)
  })
  for (const overlay of ['dialog', 'sheet'] as const) {
    it(`mouse selection in ${overlay} returns focus to Select rather than the parent popup`, async () => {
      const changed = vi.fn()
      const m = await mount({ defaultValue: 'a', onValueChange: changed }, overlay)
      await m.open()
      await userEvent.click(m.option('Bravo'))
      await settle()
      expect(changed).toHaveBeenCalledExactlyOnceWith('b', items[1])
      expect(m.trigger().textContent).toContain('Bravo')
      expect(document.activeElement).toBe(m.trigger())
      expect(document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')?.dataset.state).toBe('open')
    })
    it(`escapes ${overlay} clipping, and Escape closes only the select`, async () => {
      const m = await mount({ defaultValue: 'a' }, overlay)
      const dialog = document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')!
      await m.open()
      const positioner = dialog.parentElement!.querySelector<HTMLElement>('[data-part="positioner"]')!
      expect(positioner.hasAttribute('popover')).toBe(false)
      const box = m.option('Bravo').getBoundingClientRect()
      expect(m.option('Bravo').contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2))).toBe(true)
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(dialog.dataset.state).toBe('open')
      expect(m.trigger().getAttribute('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(m.trigger())
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(dialog.dataset.state).toBe('closed')
    })
  }
  it('selects once, submits the resolved value and resets without a callback', async () => {
    const changed = vi.fn()
    const m = await mount({ defaultValue: 'a', onValueChange: changed })
    await m.open()
    await userEvent.click(m.option('Bravo'))
    await settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('b', items[1])
    expect(new FormData(m.form).get('stage')).toBe('b')
    m.form.reset()
    await settle()
    expect(new FormData(m.form).get('stage')).toBe('a')
    expect(changed).toHaveBeenCalledTimes(1)
  })
  it('allows a controlled owner to refuse a selection', async () => {
    const changed = vi.fn()
    const m = await mount({ value: 'a', onValueChange: changed })
    await m.open()
    await userEvent.click(m.option('Bravo'))
    await settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('b', items[1])
    expect(m.trigger().textContent).toContain('Alpha')
    expect(new FormData(m.form).get('stage')).toBe('a')
  })
  it('follows items arriving in an empty open list', async () => {
    const m = await mount({ items: [] })
    await m.open()
    expect(document.querySelector('[data-part="empty"]')?.textContent).toBe('No options')
    await m.render({ items })
    expect(document.querySelector('[data-part="empty"]')).toBeNull()
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(3)
  })
})
