import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { page, userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsShellPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,100));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren();await page.viewport(414,896)})
it('traps drawer focus, dismisses nested overlays in order, and restores toggle focus',async()=>{
 await page.viewport(600,800)
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const toggle=host.querySelector<HTMLElement>('[data-part=toggle]')!, aside=host.querySelector<HTMLElement>('[data-part=aside]')!
 const draft=host.querySelector<HTMLInputElement>('[aria-label="Sidebar draft"]')!
 await userEvent.click(toggle);await settle();expect(aside.contains(document.activeElement)).toBe(true)
 expect(aside.getAttribute('aria-modal')).toBe('true')
 await userEvent.keyboard('{Shift>}{Tab}{/Shift}');await settle();expect(aside.contains(document.activeElement)).toBe(true)
 const select=aside.querySelector<HTMLElement>('[data-scope=select][data-part=trigger]')!
 await userEvent.click(select);await settle();await userEvent.keyboard('{Escape}');await settle()
 expect(toggle.getAttribute('aria-expanded')).toBe('true');expect(document.activeElement).toBe(select)
 await userEvent.keyboard('{Escape}');await settle();expect(toggle.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(toggle)
 await userEvent.click(toggle);await settle();await userEvent.click(aside.querySelector('a')!);await settle()
 expect(toggle.getAttribute('aria-expanded')).toBe('false');expect(host.querySelector('[aria-label="Shell events"]')!.textContent).toContain('false:navigate')
 expect(host.querySelector('[aria-label="Sidebar draft"]')).toBe(draft)
})
it('preserves sidebar DOM and drafts across desktop resize and drawer reopen',async()=>{
 await page.viewport(600,800)
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const toggle=host.querySelector<HTMLElement>('[data-part=toggle]')!, aside=host.querySelector<HTMLElement>('[data-part=aside]')!
 const draft=host.querySelector<HTMLInputElement>('[aria-label="Sidebar draft"]')!
 await userEvent.click(toggle);await settle();await userEvent.fill(draft,'edited')
 await page.viewport(1200,800);await settle()
 expect(aside.getAttribute('role')).toBe('complementary');expect(getComputedStyle(aside).visibility).toBe('visible')
 expect(host.querySelector('[aria-label="Sidebar draft"]')).toBe(draft);expect(draft.value).toBe('edited')
 expect(host.querySelector('[aria-label="Shell events"]')!.textContent).toContain('false:resize')
 const work=host.querySelector('main button')!
 await userEvent.click(work);await userEvent.keyboard('{Escape}');await settle();expect(document.activeElement).toBe(work)
 await page.viewport(600,800);await settle();await userEvent.click(toggle);await settle()
 expect(host.querySelector('[aria-label="Sidebar draft"]')).toBe(draft);expect(draft.value).toBe('edited')
 await userEvent.click(host.querySelector('[data-part=backdrop]')!,{position:{x:500,y:400}});await settle()
 expect(toggle.getAttribute('aria-expanded')).toBe('false')
 expect(host.querySelector('[aria-label="Shell events"]')!.textContent).toContain('false:outside')
})
