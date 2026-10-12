import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsCompositesPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 70)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
async function setup() { const host = document.createElement('div'); document.body.append(host); instance = mount(Pilot, { target: host }); flushSync(); await settle(); return host }
const button = (text: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find(el => el.textContent?.trim() === text)!
it('keeps the inline palette in page flow and leaves it open on outside clicks', async () => {
  const host = await setup(); const inline = host.querySelector<HTMLElement>('[aria-label="Inline commands"][role="dialog"]')!
  expect(inline.closest('[data-part="inline-host"]')).not.toBeNull()
  expect(getComputedStyle(inline).position).toBe('relative')
  expect(getComputedStyle(inline).marginTop).toBe('0px')
  await userEvent.click(button('Before palette')); await settle()
  expect(inline.isConnected).toBe(true)
})
it('routes command-page Escape before palette dismissal and runs after focus returns', async () => {
  await setup(); const opener = button('Open palette')
  await userEvent.click(opener); await settle()
  const palette = () => document.querySelector<HTMLElement>('[data-scope="command-palette"][data-part="content"][data-modal]')
  expect(palette()!.contains(document.activeElement)).toBe(true)
  expect(getComputedStyle(document.querySelector('[data-scope="command-palette"][data-part="backdrop"]')!).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  await userEvent.keyboard('{Enter}'); await settle()
  expect(palette()!.querySelector('[data-part="page"]')!.textContent).toBe('Move card')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(palette()).not.toBeNull()
  expect(palette()!.querySelector('[data-part="page"]')).toBeNull()
  await userEvent.keyboard('{Escape}'); await settle()
  expect(palette()).toBeNull()
  expect(document.activeElement).toBe(opener)
  await userEvent.click(opener); await settle()
  await userEvent.keyboard('{ArrowDown}{Enter}'); await settle()
  expect(document.querySelector('[aria-label="Run"]')!.textContent).toBe('plain')
  expect(document.querySelector('[aria-label="Focus at run"]')!.textContent).toBe('Open palette')
})
it('focuses the safe answer, shows async rejection, and closes Popconfirm before its Dialog', async () => {
  await setup(); await userEvent.click(button('Open confirmations')); await settle()
  const opener = button('Ask to delete'); await userEvent.click(opener); await settle()
  const confirmation = () => document.querySelector('[role="alertdialog"]')
  expect(document.activeElement).toBe(button('Cancel'))
  await userEvent.click(button('Delete')); await settle()
  expect(confirmation()!.querySelector('[role="alert"]')!.textContent).toBe('Item is locked')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(confirmation()).toBeNull()
  expect(document.activeElement).toBe(opener)
  expect(document.querySelector('[data-scope="dialog"][data-part="content"]')!.getAttribute('data-state')).toBe('open')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(document.activeElement).toBe(button('Open confirmations'))
})

it('opens through Ctrl+K and restores the element that held focus', async () => {
  await setup(); const before = button('Before palette')
  before.focus(); await userEvent.keyboard('{Control>}k{/Control}'); await settle()
  expect(document.activeElement!.getAttribute('role')).toBe('combobox')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(document.activeElement).toBe(before)
})
