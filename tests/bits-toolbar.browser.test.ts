import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsToolbarPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,40));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);document.body.replaceChildren()})
it('registers toolbar buttons, skips disabled items, supports vertical navigation and leaves mixed controls unmanaged',async()=>{
 const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host});flushSync();await settle()
 const actions=host.querySelector('[role=toolbar][aria-label=Actions]')!
 const buttons=actions.querySelectorAll<HTMLButtonElement>('button')
 expect([...buttons].filter(button=>button.tabIndex===0)).toEqual([buttons[0]])
 buttons[0].focus();await userEvent.keyboard('{ArrowRight}');await settle();expect(document.activeElement).toBe(buttons[2])
 await userEvent.keyboard('{Home}');await settle();expect(document.activeElement).toBe(buttons[0])
 await userEvent.keyboard(' ');await settle();expect(host.querySelector('[aria-label="Actions count"]')!.textContent).toBe('1')
 const vertical=host.querySelector('[role=toolbar][aria-label=Vertical]')!.querySelectorAll<HTMLButtonElement>('button')
 vertical[0].focus();await userEvent.keyboard('{ArrowDown}');await settle();expect(document.activeElement).toBe(vertical[1])
 const tools=host.querySelector('[role=toolbar][aria-label=Tools]')!.querySelectorAll<HTMLButtonElement>('button')
 tools[0].focus();await userEvent.keyboard('{ArrowRight}');await settle();expect(document.activeElement).toBe(tools[1])
 const mixed=host.querySelector<HTMLInputElement>('[aria-label="Mixed text"]')!
 expect(mixed.closest('[role=toolbar]')).toBeNull()
 await userEvent.fill(mixed,'abc');mixed.setSelectionRange(2,2);await userEvent.keyboard('{ArrowLeft}');expect(mixed.selectionStart).toBe(1)
 expect(host.querySelector('[data-scope=toolbar]:not([role]) button')!.getAttribute('tabindex')).not.toBe('-1')
})
