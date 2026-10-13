import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsDatePopupPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,60));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('opens an anchored date popup, selects and submits ISO dates, resets and returns focus on Escape',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const input=host.querySelector<HTMLInputElement>('[data-part=input]')!
 const trigger=host.querySelector<HTMLElement>('[data-part=trigger]')!
 await userEvent.click(trigger);await settle()
 const popup=document.querySelector<HTMLElement>('[data-scope=date-picker][data-part=content]')!
 expect(popup).not.toBeNull();expect(popup.contains(document.activeElement)).toBe(true)
 const control=host.querySelector<HTMLElement>('[data-part=control]')!.getBoundingClientRect()
 const rect=popup.getBoundingClientRect();expect(Math.abs(rect.left-control.left)).toBeLessThan(3);expect(rect.top).toBeGreaterThanOrEqual(control.bottom)
 await userEvent.click(popup.querySelector('[data-date="2026-10-15"]')!);await settle()
 const form=host.querySelector('form')!;expect(new FormData(form).get('day')).toBe('2026-10-15')
 expect(trigger.getAttribute('aria-expanded')).toBe('false')
 form.reset();await settle();expect(new FormData(form).get('day')).toBe('2026-10-12')
 input.focus();await userEvent.keyboard('{ArrowDown}');await settle();expect(trigger.getAttribute('aria-expanded')).toBe('true')
 await userEvent.keyboard('{ArrowRight}{Enter}');await settle();expect(document.activeElement).toBe(input)
 await userEvent.keyboard('{ArrowDown}');await settle()
 await userEvent.keyboard('{Escape}');await settle();expect(document.activeElement).toBe(input)
 await userEvent.click(trigger);await settle()
 const outside=host.querySelectorAll<HTMLButtonElement>('button').item(2)
 await userEvent.click(outside);await settle()
 expect(document.activeElement).toBe(outside);expect(trigger.getAttribute('aria-expanded')).toBe('false')
})
