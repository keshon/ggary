import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/SvelteNativeChoicesPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 30)); flushSync() }
afterEach(async () => { if(instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
async function setup() {
 const host = document.createElement('div'); document.body.append(host)
 instance = mount(Pilot, {target:host}); flushSync(); await settle()
 return host
}
it('uses native label/Space activation, required validation, submission and form reset', async () => {
 const host = await setup(); const form = host.querySelector('form')!
 const terms = host.querySelector<HTMLInputElement>('[name=terms]')!
 expect(form.checkValidity()).toBe(false)
 await userEvent.click(terms.closest('label')!); await settle()
 expect(terms.checked).toBe(true); expect(form.checkValidity()).toBe(true)
 const enabled = host.querySelector<HTMLInputElement>('[name=enabled]')!
 enabled.focus(); await userEvent.keyboard(' '); await settle()
 expect(enabled.checked).toBe(false)
 expect(new FormData(form).get('terms')).toBe('yes')
 expect(new FormData(form).has('enabled')).toBe(false)
 expect(new FormData(form).get('stage')).toBe('')
 form.reset(); await settle()
 expect(terms.checked).toBe(false); expect(enabled.checked).toBe(true)
})
it('preserves mixed state, readonly refusal and disabled fieldsets', async () => {
 const host = await setup()
 const mixed = host.querySelector<HTMLInputElement>('[name=mixed]')!
 expect(mixed.indeterminate).toBe(true)
 mixed.focus(); await userEvent.keyboard(' '); await settle()
 expect(mixed.indeterminate).toBe(false); expect(mixed.checked).toBe(true)
 for (const input of host.querySelectorAll<HTMLInputElement>('[aria-readonly=true]')) {
  await userEvent.click(input.closest('label')!); await settle()
  input.focus(); await userEvent.keyboard(' '); await settle()
  expect(input.checked).toBe(false)
 }
 expect([...host.querySelectorAll('fieldset input')].every(el => el.matches(':disabled'))).toBe(true)
 const data = new FormData(host.querySelector('form')!)
 expect(data.has('blocked')).toBe(false); expect(data.has('blockedSwitch')).toBe(false); expect(data.has('blockedRadio')).toBe(false)
 host.querySelector('form')!.reset(); await settle()
 expect(mixed.indeterminate).toBe(true); expect(mixed.checked).toBe(false)
})
it('native radio arrows skip disabled options and retain empty public values on reset', async () => {
 const host = await setup()
 const radios = host.querySelectorAll<HTMLInputElement>('input[name=stage]')
 radios[0].focus(); await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(document.activeElement).toBe(radios[2]); expect(radios[2].checked).toBe(true)
 expect(new FormData(host.querySelector('form')!).get('stage')).toBe('ready')
 host.querySelector('form')!.reset(); await settle()
 expect(radios[0].checked).toBe(true)
})
