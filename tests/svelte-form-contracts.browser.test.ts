import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/SvelteFormContractsPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 50)); flushSync() }
afterEach(async () => { if(instance) await unmount(instance); document.body.replaceChildren() })
it('preserves native constraints, Field labels and server errors, and resets the form', async () => {
 const host=document.createElement('div'); document.body.append(host); instance=mount(Pilot,{target:host}); flushSync(); await settle()
 const input=host.querySelector<HTMLInputElement>('input[name=count]')!
 const form=host.querySelector('form')!
 expect(input.value).toBe('4')
 await userEvent.click(host.querySelector('label')!); expect(document.activeElement).toBe(input)
 expect(input.getAttribute('aria-describedby')).toContain(host.querySelector('[data-part=hint]')!.id)
 await userEvent.fill(input,''); await settle()
 await userEvent.click(host.querySelector('[type=submit]')!); await settle()
 expect(form.checkValidity()).toBe(false)
 expect(host.querySelector('[aria-label="Submission count"]')!.textContent).toBe('0')
 await userEvent.fill(input,'6'); await settle()
 await userEvent.click(host.querySelector('[type=submit]')!); await settle()
 expect(host.querySelector('[aria-label="Submission count"]')!.textContent).toBe('1')
 expect(host.textContent).toContain('Server rejected count')
 expect(new FormData(form).get('count')).toBe('6'); expect(new FormData(form).has('blocked')).toBe(false)
 form.reset(); await settle()
 expect(input.value).toBe('4'); expect(host.textContent).not.toContain('Server rejected count')
})
it('disabled fieldsets also block the custom scrub enhancement', async () => {
 const host=document.createElement('div'); document.body.append(host); instance=mount(Pilot,{target:host}); flushSync(); await settle()
 const input=host.querySelector<HTMLInputElement>('input[name=blocked]')!
 const handle=input.parentElement!.querySelector('[data-part=axis]')!
 handle.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:0,pointerId:1,bubbles:true}))
 handle.dispatchEvent(new PointerEvent('pointermove',{clientX:10,pointerId:1,bubbles:true}))
 handle.dispatchEvent(new PointerEvent('pointerup',{clientX:10,pointerId:1,bubbles:true})); await settle()
 expect(input.matches(':disabled')).toBe(true); expect(input.value).toBe('5')
})
