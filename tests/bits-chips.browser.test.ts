import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsChipsPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 40)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
it('navigates and selects chips, submits public keys, resets and transfers focus after removal', async () => {
 const host=document.createElement('div'); document.body.append(host); instance=mount(Pilot,{target:host}); flushSync(); await settle()
 const list=host.querySelector<HTMLElement>('[role=toolbar]')!
 const buttons=()=>list.querySelectorAll<HTMLButtonElement>('button')
 buttons()[0].focus(); await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(document.activeElement).toBe(buttons()[2])
 await userEvent.keyboard(' '); await settle()
 const form=host.querySelector('form')!
 expect(new FormData(form).getAll('tags')).toEqual(['','a'])
 await userEvent.keyboard('b'); await settle()
 expect(document.activeElement).toBe(buttons()[3])
 await userEvent.keyboard('{Delete}'); await settle()
 expect(host.querySelector('[aria-label="Removal count"]')!.textContent).toBe('1')
 expect(document.activeElement).toBe(buttons()[2])
 form.reset(); await settle()
 expect(new FormData(form).getAll('tags')).toEqual([''])
 const single=host.querySelectorAll<HTMLElement>('[role=toolbar]')[1].querySelectorAll('button')
 await userEvent.click(single[0]); await settle()
 expect(new FormData(form).getAll('single')).toEqual([''])
 await userEvent.click(single[1]); await settle()
 expect(new FormData(form).getAll('single')).toEqual(['x'])
 await userEvent.click(single[1]); await settle()
 expect(new FormData(form).has('single')).toBe(false)
})
