import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsTimePopupPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,60));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('anchors the time popup, preserves typed off-step values, selection, reset and outside focus',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const form=host.querySelector('form')!
 const input=form.querySelector<HTMLInputElement>('[data-part=input]')!
 const trigger=form.querySelector<HTMLElement>('[data-part=trigger]')!
 await userEvent.click(trigger);await settle()
 const popup=document.querySelector<HTMLElement>('[data-scope=time-picker][data-part=content][data-state=open]')!
 expect(document.activeElement).toBe(input)
 const control=form.querySelector('[data-part=control]')!.getBoundingClientRect(), rect=popup.getBoundingClientRect()
 expect(Math.abs(rect.left-control.left)).toBeLessThan(3)
 expect(Math.abs(rect.width-control.width)).toBeLessThan(3)
 expect(rect.top).toBeGreaterThanOrEqual(control.bottom)
 const item=(time:string)=>popup.querySelector<HTMLElement>(`[id$="-time-${time}"]`)!
 item('1430').click();await settle();expect(new FormData(form).get('starts')).toBe('14:00')
 await userEvent.click(item('1500'));await settle();expect(new FormData(form).get('starts')).toBe('15:00')
 expect(document.activeElement).toBe(input);expect(trigger.getAttribute('aria-expanded')).toBe('false')
 await userEvent.fill(input,'16:37');await userEvent.keyboard('{Enter}');await settle()
 expect(new FormData(form).get('starts')).toBe('16:37')
 form.reset();await settle();expect(new FormData(form).get('starts')).toBe('14:00')
 await userEvent.click(trigger);await settle();await userEvent.keyboard('{Escape}');await settle()
 expect(trigger.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(input)
 await userEvent.click(trigger);await settle()
 const outside=host.querySelector<HTMLButtonElement>('[aria-label=Outside]')!
 await userEvent.click(outside);await settle();expect(document.activeElement).toBe(outside)
 expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

it('composes independent date and time popups into one ISO datetime',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const form=host.querySelectorAll('form')[1]
 const input=form.querySelector<HTMLInputElement>('[data-scope=time-picker][data-part=input]')!
 const trigger=form.querySelector<HTMLElement>('[data-scope=time-picker][data-part=trigger]')!
 await userEvent.click(trigger);await settle()
 await userEvent.click(document.querySelector('[data-scope=time-picker][id$="-time-1600"]')!);await settle()
 expect(new FormData(form).get('meeting')).toBe('2026-10-14T16:00')
 const dateTrigger=form.querySelector<HTMLElement>('[data-scope=date-picker][data-part=trigger]')!
 await userEvent.click(dateTrigger);await settle()
 await userEvent.click(document.querySelector('[data-scope=calendar][data-date="2026-10-15"]')!);await settle()
 expect(new FormData(form).get('meeting')).toBe('2026-10-15T16:00')
 await userEvent.fill(input,'16:37');await userEvent.keyboard('{Enter}');await settle()
 expect(new FormData(form).get('meeting')).toBe('2026-10-15T16:37')
 form.reset();await settle();expect(new FormData(form).get('meeting')).toBe('2026-10-14T15:30')
})
