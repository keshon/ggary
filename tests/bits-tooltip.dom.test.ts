import { afterEach, expect, it, vi } from 'vitest'
import { mount, unmount, flushSync } from 'svelte'
import TooltipWithTrigger from './conformance/adapters/TooltipWithTrigger.svelte'
let instance: ReturnType<typeof mount> | undefined
const wait = async (ms: number) => { flushSync(); await new Promise(resolve => setTimeout(resolve, ms)); flushSync() }
afterEach(async () => { if (instance) await unmount(instance); instance = undefined; document.body.replaceChildren() })
async function setup() {
  const changed = vi.fn(); const host = document.createElement('div'); document.body.append(host)
  instance = mount(TooltipWithTrigger, { target: host, props: { trigger: 'Help', content: 'Helpful', openDelay: 0, closeDelay: 90, onOpenChange: changed } }); flushSync()
  const trigger = host.querySelector('button')!
  const hover = async (on: boolean) => { trigger.dispatchEvent(new PointerEvent(on ? 'pointerenter' : 'pointerleave', { pointerType: 'mouse', relatedTarget: document.body })); await wait(5) }
  const shown = () => document.querySelector('[role="tooltip"]')!.getAttribute('data-state') === 'open'
  return { changed, trigger, hover, shown }
}
it('retains closeDelay and cancels delayed closure on keyboard focus', async () => {
  const { trigger, hover, shown } = await setup()
  await hover(true); expect(shown()).toBe(true)
  await hover(false); expect(shown()).toBe(true)
  trigger.focus(); await wait(130)
  expect(shown()).toBe(true)
  trigger.blur(); await wait(5)
  expect(shown()).toBe(false)
})
it('cancels a pending close callback on unmount', async () => {
  const { changed, hover } = await setup()
  await hover(true); await hover(false)
  changed.mockClear()
  await unmount(instance!); instance = undefined
  await wait(130)
  expect(changed).not.toHaveBeenCalled()
})
