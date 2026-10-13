import { afterEach, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { mount, unmount, flushSync } from 'svelte'
import { createToaster } from '../packages/core/src/components/toast'
import Pilot from './fixtures/SvelteToastPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
let store: ReturnType<typeof createToaster> | undefined
const settle=async()=>{await new Promise(resolve=>setTimeout(resolve,40));flushSync()}
afterEach(async()=>{if(instance)await unmount(instance);instance=undefined;store?.dismiss();document.body.replaceChildren()})
it('keeps timers paused while either hover or focus remains, and releases pause on unmount',async()=>{
 store=createToaster();const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host,props:{toaster:store}});flushSync();await settle()
 store.toast({title:'Saved',duration:10000});await settle()
 const region=host.querySelector<HTMLElement>('[data-part=region]')!
 expect(region.matches(':popover-open')).toBe(true)
 const close=region.querySelector<HTMLButtonElement>('[data-part=close]')!
 region.dispatchEvent(new PointerEvent('pointerenter'));await settle();close.focus();await settle()
 region.dispatchEvent(new PointerEvent('pointerleave'));await settle();expect(store.getState().paused).toBe(true)
 region.dispatchEvent(new PointerEvent('pointerenter'));await settle()
 host.querySelector<HTMLButtonElement>('button')!.focus();await settle();expect(store.getState().paused).toBe(true)
 region.dispatchEvent(new PointerEvent('pointerleave'));await settle();expect(store.getState().paused).toBe(false)
 close.focus();await settle();expect(store.getState().paused).toBe(true)
 await unmount(instance);instance=undefined;expect(store.getState().paused).toBe(false)
})
it('routes announcements by urgency and invokes actions once before dismissal',async()=>{
 store=createToaster();const host=document.createElement('div');document.body.append(host);instance=mount(Pilot,{target:host,props:{toaster:store}});flushSync();await settle()
 let actions=0
 store.toast({id:'ok',title:'Saved',duration:0,action:{label:'Undo',onClick:()=>actions++}});await settle()
 expect(host.querySelector('[aria-live=polite]')!.textContent).toContain('Saved')
 await userEvent.click(host.querySelector('[data-part=action]')!);await settle()
 expect(actions).toBe(1);expect(store.getState().toasts.find(item=>item.id==='ok')?.state).toBe('leaving')
 store.toast({title:'Failed',tone:'error'});await settle()
 expect(host.querySelector('[aria-live=assertive]')!.textContent).toContain('Failed')
 expect(host.querySelector('[aria-live=polite]')!.textContent).toBe('')
})
