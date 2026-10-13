import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsRibbonPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,40));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('selects empty keys, skips disabled tabs and retains panel drafts',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const tabs=host.querySelectorAll<HTMLElement>('[role=tab]')
 expect(tabs[0].getAttribute('aria-selected')).toBe('true')
 const draft=host.querySelector<HTMLInputElement>('[aria-label="Draft Empty"]')!
 await userEvent.fill(draft,'Keep me')
 tabs[0].focus();await userEvent.keyboard('{ArrowRight}');await settle()
 expect(document.activeElement).toBe(tabs[2]);expect(tabs[2].getAttribute('aria-selected')).toBe('true')
 await userEvent.keyboard('{Home}');await settle()
 expect(tabs[0].getAttribute('aria-selected')).toBe('true');expect(draft.value).toBe('Keep me')
 const panel=host.querySelector<HTMLElement>('[role=tabpanel]:not([hidden])')!
 expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id)
})
