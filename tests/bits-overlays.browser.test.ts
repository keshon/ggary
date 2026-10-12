import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsOverlaysPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 50)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
function setup() { const host = document.createElement('div'); document.body.append(host); instance = mount(Pilot, { target: host }); flushSync(); return host }
it('routes Select, Popover and Dialog Escape one layer at a time with focus return', async () => {
  const host = setup(); const opener = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
  await userEvent.click(opener); await settle()
  const popupTrigger = document.querySelector<HTMLButtonElement>('[data-popover-trigger]')!
  await userEvent.click(popupTrigger); await settle()
  const popup = () => document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]')
  expect(popup()!.contains(document.activeElement)).toBe(true)
  const select = popup()!.querySelector('[role="combobox"]')!
  await userEvent.click(select); await settle()
  await userEvent.keyboard('{Escape}'); await settle()
  expect(popup()).not.toBeNull()
  await userEvent.keyboard('{Escape}'); await settle()
  expect(popup()).toBeNull()
  expect(document.activeElement).toBe(popupTrigger)
  const dialog = document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')!
  expect(dialog.dataset.state).toBe('open')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(dialog.dataset.state).toBe('closed')
  expect(document.activeElement).toBe(opener)
})
it('shows Tooltip on keyboard focus, closes on Escape, and leaves the trigger usable', async () => {
  const host = setup(); const trigger = [...host.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent === 'Outside help trigger')!
  trigger.focus(); await settle()
  const tooltip = () => document.querySelector<HTMLElement>('[role="tooltip"]:not([hidden])')
  expect(tooltip()!.textContent).toBe('Outside help')
  expect(trigger.getAttribute('aria-describedby')).toBe(tooltip()!.id)
  const rect = tooltip()!.getBoundingClientRect()
  expect(rect.width).toBeGreaterThan(0)
  await userEvent.keyboard('{Escape}'); await settle()
  expect(tooltip()).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
