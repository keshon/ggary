import { afterEach, expect, it } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import { userEvent } from '@vitest/browser/context'
import Pilot from './fixtures/BitsSlidersPilot.svelte'
import '../packages/structure/src/index.css'
import '@ggary/theme-ggarry'
let instance: ReturnType<typeof mount> | undefined
const settle = async () => { await new Promise(resolve => setTimeout(resolve, 50)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); document.body.replaceChildren() })
it('submits canonical slider values, enforces the minimum gap, and resets both controls', async () => {
 const host = document.createElement('div'); document.body.append(host)
 instance = mount(Pilot, { target: host }); flushSync(); await settle()
 const sliders = host.querySelectorAll<HTMLElement>('[role="slider"]')
 expect(sliders.length).toBe(8)
 sliders[0].focus(); await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(sliders[0].getAttribute('aria-valuenow')).toBe('41')
 sliders[1].focus(); await userEvent.keyboard('{End}'); await settle()
 expect(sliders[1].getAttribute('aria-valuenow')).toBe('60')
 const form = host.querySelector('form')!
 expect(new FormData(form).get('volume')).toBe('41')
 expect(new FormData(form).get('low')).toBe('60')
 expect(new FormData(form).get('high')).toBe('70')
 form.reset(); await settle()
 expect(sliders[0].getAttribute('aria-valuenow')).toBe('40')
 expect(sliders[1].getAttribute('aria-valuenow')).toBe('20')
 const control = host.querySelector<HTMLElement>('[data-scope=slider][data-part=control]')!
 const rect = control.getBoundingClientRect()
 const thumb = sliders[0].getBoundingClientRect()
 expect(thumb.width).toBe(12)
 expect(thumb.height).toBe(12)
 expect(Math.abs(thumb.x + thumb.width / 2 - (rect.x + rect.width * 0.4))).toBeLessThan(2)
 expect(Math.abs(thumb.y + thumb.height / 2 - (rect.y + rect.height / 2))).toBeLessThan(1)
 const rangeControl = host.querySelector<HTMLElement>('[data-scope=range-slider][data-part=control]')!
 const rangeRect = rangeControl.getBoundingClientRect()
 const rangeThumb = host.querySelector<HTMLElement>('[data-scope=range-slider][data-part=thumb-handle]')!.getBoundingClientRect()
 expect(Math.abs(rangeThumb.y + rangeThumb.height / 2 - (rangeRect.y + rangeRect.height / 2))).toBeLessThan(1)
 const fill = rangeControl.querySelector<HTMLElement>('[data-part=range]')!.getBoundingClientRect()
 expect(Math.abs(fill.width - rangeRect.width * 0.5)).toBeLessThan(2)
 await userEvent.click(control); await settle()
 expect(sliders[0].getAttribute('aria-valuenow')).toBe('50')
 expect(control.hasAttribute('data-pointer-focus')).toBe(true)
 expect(getComputedStyle(sliders[0]).outlineStyle).toBe('none')
 await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(control.hasAttribute('data-pointer-focus')).toBe(false)
 expect(getComputedStyle(sliders[0]).outlineStyle).toBe('solid')
})

it('preserves Field naming, readonly refusal, disabled fieldsets and RTL keys', async () => {
 const host = document.createElement('div'); document.body.append(host)
 instance = mount(Pilot, { target: host }); flushSync(); await settle()
 const readonly = host.querySelector<HTMLElement>('[aria-readonly="true"]')!
 const label = host.querySelector('[data-scope=field][data-part=label]')!
 expect(readonly.getAttribute('aria-labelledby')).toBe(label.id)
 await userEvent.click(label); expect(document.activeElement).toBe(readonly)
 await userEvent.keyboard('{ArrowRight}'); await settle()
 expect(readonly.getAttribute('aria-valuenow')).toBe('30')
 expect([...host.querySelectorAll('[data-scope=fieldset] [role=slider]')].every(el => el.getAttribute('aria-disabled') === 'true')).toBe(true)
 const rtl = host.querySelector<HTMLElement>('[aria-label="RTL volume"]')!
 rtl.focus(); await userEvent.keyboard('{ArrowLeft}'); await settle()
 expect(rtl.getAttribute('aria-valuenow')).toBe('41')
})
