import { afterEach, expect, it, vi } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { mount, unmount, flushSync } from 'svelte'
import Pilot from './fixtures/BitsPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'

let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 40)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
function setup(props = {}) {
  const host = document.createElement('div'); document.body.append(host)
  instance = mount(Pilot, { target: host, props }); flushSync()
  return host
}
const trigger = () => document.querySelector<HTMLButtonElement>('[data-scope="select"][data-part="trigger"]')!
const dialog = () => document.querySelector<HTMLElement>('[data-backend="bits-ui"][data-scope="dialog"][data-part="content"]')!

it('keeps Select above Dialog, routes inner/outer Escape and restores focus', async () => {
  const changed = vi.fn(); const host = setup({ onOpenChange: changed })
  const opener = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
  await userEvent.click(opener); await settle()
  expect(dialog().contains(document.activeElement)).toBe(true)
  for (let i = 0; i < 6; i++) { await userEvent.tab(); expect(dialog().contains(document.activeElement)).toBe(true) }
  await userEvent.click(trigger()); await settle()
  const popup = document.querySelector<HTMLElement>('[data-backend="bits-ui"][data-part="positioner"]')!
  const option = document.querySelector<HTMLElement>('[role="option"]')!
  const rect = option.getBoundingClientRect()
  expect(option.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))).toBe(true)
  expect(getComputedStyle(popup).position).toBe('fixed')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(trigger().getAttribute('aria-expanded')).toBe('false')
  expect(dialog().dataset.state).toBe('open')
  expect(document.activeElement).toBe(trigger())
  await userEvent.keyboard('{Escape}'); await settle()
  expect(dialog().dataset.state).toBe('closed')
  expect(document.activeElement).toBe(opener)
  expect(changed.mock.calls).toEqual([[true, { reason: 'trigger' }], [false, { reason: 'escape' }]])
})

it('updates bindings, submits one value, resets and supports method=dialog', async () => {
  const changed = vi.fn(); const selected = vi.fn(); const host = setup({ onOpenChange: changed, onValueChange: selected })
  await userEvent.click(host.querySelector('[aria-haspopup="dialog"]')!); await settle()
  await userEvent.click(trigger()); await settle()
  await userEvent.click([...document.querySelectorAll<HTMLElement>('[role="option"]')].find(el => el.textContent?.includes('Bravo'))!); await settle()
  const form = dialog().querySelector('form')!
  expect(new FormData(form).getAll('stage')).toEqual(['b'])
  expect(host.querySelector('output')!.textContent).toBe('open:b')
  expect(selected.mock.calls).toEqual([['b', expect.objectContaining({ value: 'b' })]])
  await userEvent.click(form.querySelector('[type="reset"]')!); await settle()
  expect(new FormData(form).getAll('stage')).toEqual(['a'])
  expect(host.querySelector('output')!.textContent).toBe('open:a')
  await userEvent.click(form.querySelector('[type="submit"]')!); await settle()
  expect(dialog().dataset.state).toBe('closed')
  expect(changed).toHaveBeenLastCalledWith(false, { reason: 'native', returnValue: 'accepted' })
})

it('dismisses outside; persistent dialogs require their close button', async () => {
  const changed = vi.fn(); const host = setup({ onOpenChange: changed })
  await userEvent.click(host.querySelector('[aria-haspopup="dialog"]')!); await settle()
  await userEvent.click(document.querySelector('[data-part="backdrop"][data-backend="bits-ui"]')!, { position: { x: 5, y: 5 } }); await settle()
  expect(changed).toHaveBeenLastCalledWith(false, { reason: 'outside' })
  await unmount(instance!); instance = undefined; document.body.replaceChildren()
  const persistent = setup({ persistent: true })
  await userEvent.click(persistent.querySelector('[aria-haspopup="dialog"]')!); await settle()
  await userEvent.keyboard('{Escape}'); await settle()
  await userEvent.click(document.querySelector('[data-part="backdrop"][data-backend="bits-ui"]')!, { position: { x: 5, y: 5 } }); await settle()
  expect(dialog().dataset.state).toBe('open')
  await userEvent.click(dialog().querySelector('[data-part="close"]')!); await settle()
  expect(dialog().dataset.state).toBe('closed')
})
