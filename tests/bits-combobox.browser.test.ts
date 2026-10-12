import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsComboboxPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 40)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
it('filters and selects multiple tags inside Dialog; resets and routes Escape by layer', async () => {
  const host = document.createElement('div'); document.body.append(host)
  instance = mount(Pilot, { target: host }); flushSync()
  const opener = host.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!
  await userEvent.click(opener); await settle()
  const dialog = () => document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]')!
  const input = () => dialog().querySelector<HTMLInputElement>('[data-scope="combobox"][data-part="input"]')!
  await userEvent.fill(input(), 'Bra'); await settle()
  const option = document.querySelector<HTMLElement>('[role="option"]')!
  expect(option.textContent).toContain('Bravo')
  const rect = option.getBoundingClientRect()
  expect(option.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2))).toBe(true)
  await userEvent.keyboard('{Enter}'); await settle()
  expect(host.querySelector('output')!.textContent).toBe('a,b')
  expect(new FormData(dialog().querySelector('form')!).getAll('tags')).toEqual(['a', 'b'])
  expect(input().value).toBe('')
  expect(dialog().dataset.state).toBe('open')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(dialog().dataset.state).toBe('open')
  expect(input().getAttribute('aria-expanded')).toBe('false')
  await userEvent.click(dialog().querySelector('[type="reset"]')!); await settle()
  expect(host.querySelector('output')!.textContent).toBe('a')
  await userEvent.click(input()); await userEvent.keyboard('{ArrowDown}'); await settle()
  await userEvent.keyboard('{Escape}'); await settle()
  await userEvent.keyboard('{Escape}'); await settle()
  expect(dialog().dataset.state).toBe('closed')
  expect(document.activeElement).toBe(opener)
})
