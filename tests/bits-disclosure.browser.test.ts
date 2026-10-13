import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { userEvent } from '@vitest/browser/context'
import { Tabs as ReactTabs } from '../packages/react/src/index'
import Pilot from './fixtures/BitsDisclosurePilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
let react: Root | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 50)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); react?.unmount(); react = undefined; instance = undefined; document.body.replaceChildren() })
async function setup() { const host = document.createElement('div'); document.body.append(host); instance = mount(Pilot, { target: host }); flushSync(); await settle(); return host }
const tab = (name: string) => [...document.querySelectorAll<HTMLElement>('[role="tab"]')].find(el => el.textContent?.trim() === name)!
it('keeps empty keys, skips disabled tabs, preserves draft panels, and closes onto the next document', async () => {
  const host = await setup(); const empty = tab('Empty document')
  expect(empty.getAttribute('aria-selected')).toBe('true')
  const input = host.querySelector<HTMLInputElement>('[aria-label="Draft Empty document"]')!
  await userEvent.fill(input, 'Keep draft')
  empty.focus(); await userEvent.keyboard('{ArrowRight}'); await settle()
  expect(document.activeElement).toBe(tab('Document one'))
  await userEvent.keyboard('{Delete}'); await settle()
  expect(document.activeElement).toBe(tab('Document three'))
  expect(tab('Document three').getAttribute('aria-selected')).toBe('true')
  expect(host.querySelector('[aria-label="Selected document"]')!.textContent).toBe('three')
  await userEvent.keyboard('{Home}'); await settle()
  expect(input.value).toBe('Keep draft')
  const list = document.querySelector<HTMLElement>('[role="tablist"][aria-label="Documents"]')!
  expect(getComputedStyle(list).scrollbarWidth).toBe('none')
  expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
  await userEvent.keyboard('{End}'); await settle()
  expect(list.scrollLeft).toBeGreaterThan(0)
})
it('manual tabs move focus without selection until Enter', async () => {
  await setup(); tab('Manual alpha').focus()
  await userEvent.keyboard('{ArrowRight}'); await settle()
  expect(document.activeElement).toBe(tab('Manual bravo'))
  expect(tab('Manual alpha').getAttribute('aria-selected')).toBe('true')
  await userEvent.keyboard('{Enter}'); await settle()
  expect(tab('Manual bravo').getAttribute('aria-selected')).toBe('true')
})
it('discloses empty-string sections, preserves noncollapsible selection, and reveals find-in-page content', async () => {
  const host = await setup(); const trigger = [...host.querySelectorAll<HTMLButtonElement>('[data-scope="accordion"][data-part="trigger"]')].find(el => el.textContent?.includes('Empty section'))!
  await userEvent.click(trigger); await settle()
  expect(host.querySelector('[aria-label="Open sections"]')!.textContent).toBe('[""]')
  await userEvent.keyboard('{Enter}'); await settle()
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  const other = host.querySelector<HTMLElement>('[data-scope="accordion"][data-part="item"][data-value="other"] [data-part="content"]')!
  expect(other.getAttribute('hidden')).toBe('until-found')
  other.dispatchEvent(new Event('beforematch')); await settle()
  expect(other.hasAttribute('hidden')).toBe(false)
  expect(host.querySelector('[aria-label="Open sections"]')!.textContent).toBe('["other"]')
})
it('React tab lists hide scrollbars while keyboard focus still scrolls overflowing tabs', async () => {
  const host = document.createElement('div'); host.style.width = '220px'; document.body.append(host)
  react = createRoot(host)
  react.render(createElement(ReactTabs, { items: [{ value: 'a', label: 'First long document' }, { value: 'b', label: 'Second long document' }, { value: 'c', label: 'Third long document' }], label: 'React documents' }))
  await settle()
  const list = host.querySelector<HTMLElement>('[role="tablist"]')!
  expect(getComputedStyle(list).scrollbarWidth).toBe('none')
  expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
  host.querySelector<HTMLElement>('[role="tab"]')!.focus()
  await userEvent.keyboard('{End}'); await settle()
  expect(list.scrollLeft).toBeGreaterThan(0)
})
