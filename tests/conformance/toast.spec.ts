import { describe, expect, it, vi } from 'vitest'
import { createToaster, LEAVE_MS } from '../../packages/core/src/components/toast'
import { type Adapter, type ToasterProps, click, freshTarget, part, parts } from './harness'

/** In a browser, the platform says; under jsdom, the shim keeps the answer. */
const shownInTopLayer = (el: Element) => {
  const shim = (globalThis as { isPopoverOpen?: (el: Element) => boolean }).isPopoverOpen
  return shim ? shim(el) : el.matches(':popover-open')
}

/**
 * Toast: a region in the top layer that is open before any toast arrives,
 * announcers that exist before their message, toasts that leave on time,
 * stand still under the pointer and focus, and dismiss by their buttons.
 */
export function toastConformance(adapter: Adapter) {
  describe('toast', () => {
    const setup = async (props: Partial<ToasterProps> = {}) => {
      const toaster = props.toaster ?? createToaster()
      const m = await adapter.toaster({ toaster, ...props }, freshTarget())
      const region = () => part(m.root, 'toast', 'region')!
      const toasts = () => parts(m.root, 'toast', 'toast')
      // Each store change reaches the region through its subscription; act flushes the render.
      const show = (options: Parameters<typeof toaster.toast>[0]) => {
        let id = ''
        return adapter.act(() => void (id = toaster.toast(options))).then(() => id)
      }
      const settle = (ms: number) => adapter.wait(ms)
      return { m, toaster, region, toasts, show, settle }
    }

    it('the region is open in the top layer and named before any toast, with its announcers already there', async () => {
      const { m, region, toasts } = await setup({ label: 'Alerts' })
      expect(region().getAttribute('role')).toBe('region')
      expect(region().getAttribute('aria-label')).toBe('Alerts')
      expect(region().getAttribute('popover')).toBe('manual')
      expect(shownInTopLayer(region())).toBe(true)
      expect(toasts()).toHaveLength(0)
      const announcers = parts(m.root, 'toast', 'announcer').map((el) => el.getAttribute('aria-live'))
      expect(announcers).toEqual(['polite', 'assertive'])
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('shows a toast with its title, text and tone icon, and announces it politely', async () => {
      const { m, toasts, show } = await setup()
      await show({ title: 'The run is queued', text: 'seventh in the queue', tone: 'ok' })
      const [toast] = toasts()
      expect(part(toast, 'toast', 'title')!.textContent).toBe('The run is queued')
      expect(part(toast, 'toast', 'text')!.textContent).toBe('seventh in the queue')
      expect(toast.dataset.tone).toBe('ok')
      expect(part(toast, 'toast', 'icon')!.dataset.icon).toBe('status-ok')
      const [polite, assertive] = parts(m.root, 'toast', 'announcer')
      expect(polite.textContent).toBe('The run is queued. seventh in the queue')
      expect(assertive.textContent).toBe('')
    })

    it('an error is announced assertively, and stays', async () => {
      const { m, toasts, show, settle } = await setup()
      await show({ title: 'Could not send', tone: 'error' })
      const [polite, assertive] = parts(m.root, 'toast', 'announcer')
      expect(assertive.textContent).toBe('Could not send')
      expect(polite.textContent).toBe('')
      await settle(120)
      expect(toasts()[0].dataset.state).toBe('open')
    })

    it('leaves after its duration and is removed after its exit', async () => {
      const { toaster, toasts, show, settle } = await setup()
      await show({ title: 'Saved', duration: 60 })
      // In a real browser the mouse stays where an earlier test left it, and a
      // toast drawn under it is paused, as it should be. This test is about the
      // clock, not the pointer (the next one is): let it run.
      if (toaster.getState().paused) await adapter.act(() => toaster.resume())
      // Timers run late on a busy machine: wait for each state, not for a margin.
      const until = async (done: () => boolean) => {
        for (let waited = 0; waited < 1000 && !done(); waited += 20) await settle(20)
      }
      await until(() => toasts()[0]?.dataset.state !== 'open')
      expect(toasts()[0].dataset.state).toBe('leaving')
      await settle(LEAVE_MS)
      await until(() => toasts().length === 0)
      expect(toasts()).toHaveLength(0)
    })

    it('stands still while the pointer is on the region, and goes on when it leaves', async () => {
      const { region, toasts, show, settle } = await setup()
      await show({ title: 'Read me', duration: 80 })
      await adapter.act(() => {
        // React derives enter and leave from pointerover and pointerout; the others listen to pointerenter.
        region().dispatchEvent(new MouseEvent('pointerover', { bubbles: true, relatedTarget: document.body }))
        region().dispatchEvent(new MouseEvent('pointerenter', { bubbles: false, relatedTarget: document.body }))
      })
      await settle(150)
      expect(toasts()[0].dataset.state).toBe('open')
      await adapter.act(() => {
        region().dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
        region().dispatchEvent(new MouseEvent('pointerleave', { bubbles: false, relatedTarget: document.body }))
      })
      await settle(120)
      expect(toasts()[0].dataset.state).toBe('leaving')
    })

    it('stands still while focus is inside it', async () => {
      const { toasts, show, settle } = await setup()
      const onClick = vi.fn()
      await show({ title: 'Deleted', duration: 80, action: { label: 'Undo', onClick } })
      await adapter.act(() => part(toasts()[0], 'toast', 'action')!.focus())
      await settle(150)
      expect(toasts()[0].dataset.state).toBe('open')
    })

    it('the action runs and dismisses; the close button, named, dismisses', async () => {
      const { toasts, show } = await setup()
      const onClick = vi.fn()
      await show({ title: 'Deleted', duration: 0, action: { label: 'Undo', onClick } })
      await show({ title: 'Other', duration: 0 })
      const action = part(toasts()[0], 'toast', 'action')!
      expect(action.textContent).toBe('Undo')
      await adapter.act(() => click(action))
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(toasts()[0].dataset.state).toBe('leaving')
      const close = part(toasts()[1], 'toast', 'close')!
      expect(close.getAttribute('aria-label')).toBe('Dismiss')
      await adapter.act(() => click(close))
      expect(toasts()[1].dataset.state).toBe('leaving')
    })

    it('updating a toast by its id changes it in place', async () => {
      const { toaster, toasts, show } = await setup()
      const id = await show({ title: 'Saving…', tone: 'running', duration: 0 })
      await adapter.act(() => toaster.update(id, { title: 'Saved', tone: 'ok' }))
      expect(toasts()).toHaveLength(1)
      expect(part(toasts()[0], 'toast', 'title')!.textContent).toBe('Saved')
      expect(part(toasts()[0], 'toast', 'icon')!.dataset.icon).toBe('status-ok')
    })

    it('stands where it is placed', async () => {
      const { region } = await setup({ placement: 'top-start' })
      expect(region().dataset.placement).toBe('top-start')
    })
  })
}
