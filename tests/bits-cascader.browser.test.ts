import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsCascaderPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,60));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('anchors the column picker, selects a leaf, resets, and preserves outside focus',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const form=host.querySelector('form')!, trigger=form.querySelector<HTMLElement>('[data-part=trigger]')!
 await userEvent.click(trigger);await settle()
 const popup=document.querySelector<HTMLElement>('[data-scope=cascader][data-part=content][data-state=open]')!
 expect(popup.contains(document.activeElement)).toBe(true)
 expect(document.activeElement!.textContent).toContain('Kazan')
 const rect=popup.getBoundingClientRect(), anchor=trigger.getBoundingClientRect()
 expect(rect.top).toBeGreaterThanOrEqual(anchor.bottom);expect(Math.abs(rect.left-anchor.left)).toBeLessThan(3)
 await userEvent.keyboard('{ArrowDown}{Enter}');await settle()
 expect(new FormData(form).get('place')).toBe('chelny');expect(document.activeElement).toBe(trigger)
 form.reset();await settle();expect(new FormData(form).get('place')).toBe('kzn')
 await userEvent.click(trigger);await settle();await userEvent.keyboard('{Escape}');await settle()
 expect(document.activeElement).toBe(trigger);expect(trigger.getAttribute('aria-expanded')).toBe('false')
 await userEvent.click(trigger);await settle()
 const outside=host.querySelector<HTMLElement>('[aria-label=Outside]')!
 await userEvent.click(outside);await settle();expect(document.activeElement).toBe(outside);expect(trigger.getAttribute('aria-expanded')).toBe('false')
})
it('opens branches independently of parent selection and dismisses one nested layer at a time',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const trigger=host.querySelectorAll<HTMLElement>('[data-scope=cascader][data-part=trigger]')[1]
 await userEvent.click(trigger);await settle()
 const row=[...document.querySelectorAll<HTMLElement>('[data-scope=cascader][data-part=item]')].find(row=>row.querySelector('[data-part=item-text]')?.textContent==='Kazakhstan')!
 await userEvent.click(row.querySelector('[data-part=item-branch]')!);await settle()
 expect(trigger.getAttribute('aria-expanded')).toBe('true')
 expect(document.querySelector('[data-scope=cascader][data-part=column][data-level="1"]')!.getAttribute('aria-label')).toBe('Kazakhstan')
 await userEvent.click(row);await settle();expect(trigger.textContent).toContain('Kazakhstan')
 await userEvent.click([...host.querySelectorAll('button')].find(button=>button.textContent==='Open location settings')!);await settle()
 const nested=document.querySelector<HTMLElement>('[data-scope=dialog] [data-scope=cascader][data-part=trigger]')!
 await userEvent.click(nested);await settle()
 const leaf=[...document.querySelectorAll<HTMLElement>('[data-scope=cascader][data-part=item]')].find(row=>row.querySelector('[data-part=item-text]')?.textContent==='Moscow')!
 await userEvent.click(leaf);await settle();expect(nested.textContent).toContain('Moscow')
 await userEvent.click(nested);await settle();await userEvent.keyboard('{Escape}');await settle()
 expect(nested.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(nested)
 const dialog=document.querySelector('[data-scope=dialog][data-part=content]')!
 expect(dialog.getAttribute('data-state')).toBe('open')
 await userEvent.keyboard('{Escape}');await settle();expect(dialog.getAttribute('data-state')).toBe('closed')
})
