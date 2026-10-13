import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/SvelteNativeGroupsPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 30)); flushSync() }
afterEach(async () => { if(instance) await unmount(instance); document.body.replaceChildren() })
it('requires one enabled option per checkbox group and restores validation on reset', async () => {
 const host=document.createElement('div'); document.body.append(host)
 instance=mount(Pilot,{target:host}); flushSync(); await settle()
 const form=host.querySelector('form')!
 expect(form.checkValidity()).toBe(false)
 for(const name of ['boxes','cards']) {
  const inputs=host.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)
  expect(inputs[1].validity.customError).toBe(true)
  await userEvent.click(inputs[1].closest('label')!); await settle()
  expect(inputs[1].validity.customError).toBe(false)
  expect(new FormData(form).getAll(name)).toEqual(['a'])
 }
 expect(form.checkValidity()).toBe(true)
 const radios=host.querySelectorAll<HTMLInputElement>('input[name=view]')
 radios[0].focus(); await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(document.activeElement).toBe(radios[2]); expect(radios[2].checked).toBe(true)
 form.reset(); await settle()
 expect(form.checkValidity()).toBe(false)
 expect(new FormData(form).get('view')).toBe('')
})
