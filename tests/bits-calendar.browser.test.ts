import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsCalendarPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,40));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('navigates disabled dates and selects ISO days and a range across two months',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const calendars=host.querySelectorAll('[data-scope=calendar][data-part=root]')
 const day=(root:Element,date:string)=>root.querySelector<HTMLElement>(`[data-part=day][data-date="${date}"]:not([data-blank])`)!
 day(calendars[0],'2026-10-12').focus();await userEvent.keyboard('{ArrowRight}');await settle()
 expect(document.activeElement).toBe(day(calendars[0],'2026-10-14'))
 await userEvent.keyboard('{Enter}');await settle();expect(host.querySelector('[aria-label="Selected day"]')!.textContent).toBe('2026-10-14')
 await userEvent.click(day(calendars[1],'2026-10-29'));await settle()
 expect(host.querySelector('[aria-label="Selected range"]')!.textContent).toBe('')
 await userEvent.click(day(calendars[1],'2026-11-03'));await settle()
 expect(host.querySelector('[aria-label="Selected range"]')!.textContent).toBe('{"start":"2026-10-29","end":"2026-11-03"}')
 expect(day(calendars[1],'2026-10-30').hasAttribute('data-in-range')).toBe(true)
 expect(day(calendars[1],'2026-10-29').hasAttribute('data-range-start')).toBe(true)
 expect(day(calendars[1],'2026-11-03').hasAttribute('data-range-end')).toBe(true)
 expect(day(calendars[0],'2026-10-14').getBoundingClientRect().width).toBeGreaterThan(0)
})
