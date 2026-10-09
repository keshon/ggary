import { afterEach, describe, expect, it } from 'vitest'
import { act, createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Dialog, Sheet, Popover, Select, Combobox, Cascader, DatePicker, TimePicker, Menu, CommandPalette } from '../packages/react/src/index'
import { openLayerCount } from '@ggary/core'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let root: Root | undefined
const settle = () => new Promise(resolve => setTimeout(resolve, 50))
const items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }]
const button = (props: Record<string, unknown>) => h('button', props, 'Child opener')
afterEach(async () => {
  await act(async () => { root?.unmount(); await settle() })
  root = undefined
  document.body.replaceChildren()
})
async function mount(child: ReactNode, parent: 'dialog' | 'sheet' | 'popover' = 'dialog') {
  const host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  const props = { defaultOpen: true, title: 'Parent', trigger: button }
  await act(async () => { root!.render(parent === 'sheet' ? h(Sheet, props, child) : parent === 'popover' ? h(Popover, props, child) : h(Dialog, props, child)); await settle() })
}
const part = (scope: string, name: string) => document.querySelector<HTMLElement>(`[data-scope="${scope}"][data-part="${name}"]`)!
const escape = async () => {
  await act(async () => {
    document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    await settle()
  })
}

describe('React overlays without the legacy bridge', () => {
  for (const parent of ['dialog', 'sheet', 'popover'] as const) {
    it(`Select closes before its ${parent} parent and returns focus`, async () => {
      await mount(h(Select, { label: 'Child', items, defaultValue: 'a' }), parent)
      const trigger = part('select', 'trigger')
      await act(async () => { trigger.focus(); trigger.click(); await settle() })
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(openLayerCount()).toBe(0)
      expect(part('select', 'positioner').hasAttribute('popover')).toBe(false)
      await escape()
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      expect(part(parent === 'sheet' ? 'dialog' : parent, 'content').dataset.state).toBe('open')
      expect(document.activeElement).toBe(trigger)
      await escape()
      expect(part(parent === 'sheet' ? 'dialog' : parent, 'content').dataset.state).toBe('closed')
    })
  }
  const children: [string, () => ReactNode, string][] = [
    ['combobox', () => h(Combobox, { label: 'Child', items }), 'input'],
    ['cascader', () => h(Cascader, { label: 'Child', items }), 'trigger'],
    ['date-picker', () => h(DatePicker, { label: 'Child', defaultValue: '2026-10-14' }), 'trigger'],
    ['time-picker', () => h(TimePicker, { label: 'Child', defaultValue: '14:30' }), 'input'],
    ['menu', () => h(Menu, { items, trigger: button }), 'trigger'],
    ['popover', () => h(Popover, { title: 'Child', trigger: button }, h('input', { 'aria-label': 'Child field' })), 'trigger'],
    ['command-palette', () => h(CommandPalette, { commands: [{ id: 'a', label: 'Alpha' }], trigger: button }), 'trigger'],
  ]
  for (const [scope, child, openerPart] of children) {
    it(`${scope} Escape leaves its Dialog parent open without legacy registrations`, async () => {
      await mount(child())
      const opener = part(scope, openerPart) ?? Array.from(part('dialog', 'content').querySelectorAll('button')).find(button => button.textContent === 'Child opener')!
      await act(async () => {
        opener.focus()
        if (openerPart === 'input') opener.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
        else opener.click()
        await settle()
      })
      expect(part(scope, 'content').dataset.state).toBe('open')
      expect(openLayerCount()).toBe(0)
      await escape()
      expect(part(scope, 'content')?.dataset.state ?? 'closed').toBe('closed')
      expect(part('dialog', 'content').dataset.state).toBe('open')
    })
  }
})
