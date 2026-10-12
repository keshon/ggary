import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsDomainMenusPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 70)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
const menu = () => document.querySelector<HTMLElement>('[role="menu"]')
const item = (text: string) => [...document.querySelectorAll<HTMLElement>('[role^="menuitem"]')].find(el => el.querySelector('[data-part="item-text"]')?.textContent === text)!
async function setup() { const host = document.createElement('div'); document.body.append(host); instance = mount(Pilot, { target: host }); flushSync(); const opener = host.querySelector('button')!; await userEvent.click(opener); await settle(); return opener }
it('opens row menus at the pointer and keyboard cell, reports the row, and restores grid focus inside Dialog', async () => {
  const opener = await setup(); const grid = document.querySelector<HTMLElement>('[data-scope="data-grid"][data-part="root"]')!
  const cell = [...grid.querySelectorAll<HTMLElement>('[data-part="cell"]')].find(el => el.textContent === 'Bravo')!
  await userEvent.click(cell, { button: 'right' }); await settle()
  expect(menu()!.getAttribute('aria-label')).toBe('Row actions')
  expect(menu()!.getBoundingClientRect().width).toBeGreaterThan(0)
  await userEvent.click(item('Archive row')); await settle()
  expect(document.querySelector('[aria-label="Row selection"]')!.textContent).toBe('archive:2')
  expect(document.activeElement).toBe(grid)
  await userEvent.keyboard('{Shift>}{F10}{/Shift}'); await settle()
  expect(document.activeElement).toBe(item('Open row'))
  await userEvent.keyboard('{Escape}'); await settle()
  expect(menu()).toBeNull()
  expect(document.activeElement).toBe(grid)
  expect(document.querySelector('[role="dialog"]')!.getAttribute('data-state')).toBe('open')
  await userEvent.keyboard('{Escape}'); await settle()
  expect(document.activeElement).toBe(opener)
})
it('opens Kanban submenus, moves the original card, and returns focus to its new DOM location', async () => {
  await setup(); const card = () => document.querySelector<HTMLElement>('[data-scope="kanban"][data-part="card"][data-card="a"]')!
  card().focus(); await userEvent.keyboard('{Shift>}{F10}{/Shift}'); await settle()
  expect(document.activeElement).toBe(item('Move to'))
  await userEvent.keyboard('{ArrowRight}'); await settle()
  expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2)
  await userEvent.keyboard('{Escape}'); await settle()
  expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1)
  await userEvent.keyboard('{ArrowRight}'); await settle()
  await userEvent.click(item('Review')); await settle()
  expect(card().closest('[data-column]')!.getAttribute('data-column')).toBe('review')
  expect(menu()).toBeNull()
  expect(document.activeElement).toBe(card())
  await userEvent.click(card(), { button: 'right' }); await settle()
  await userEvent.click(item('Archive card')); await settle()
  expect(document.querySelector('[aria-label="Card selection"]')!.textContent).toBe('archive:a')
  expect(document.activeElement).toBe(card())
})
