import { describe, expect, it, vi } from 'vitest'
import { coolDownTooltips } from '../../packages/core/src/components/tooltip/tooltip.machine'
import { openLayerCount } from '../../packages/core/src/utils/dismissable'
import { type Adapter, type PopoverProps, type TooltipProps, click, freshTarget, part } from './harness'

/** In a browser, the platform says; under jsdom, the shim keeps the answer. */
const shownInTopLayer = (el: Element) => {
  const shim = (globalThis as { isPopoverOpen?: (el: Element) => boolean }).isPopoverOpen
  return shim ? shim(el) : el.matches(':popover-open')
}

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Popover: a non-modal dialog on its trigger — focus in on open, back on close,
 * dismissed by Escape and a press outside, toggled by its trigger.
 */
export function popoverConformance(adapter: Adapter) {
  describe('popover', () => {
    const setup = async (props: Partial<PopoverProps> = {}) => {
      const m = await adapter.popover({ trigger: 'Filters', title: 'Filters', ...props }, freshTarget())
      const content = () => part(m.root, 'popover', 'content')!
      const trigger = () => m.root.querySelector('[aria-haspopup="dialog"]') as HTMLButtonElement
      return {
        m,
        content,
        trigger,
        toggle: () => adapter.act(() => click(trigger())),
        escape: () =>
          adapter.act(() => {
            ;(document.activeElement ?? document.body).dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
            )
          }),
        press: (target: Element) =>
          adapter.act(() => {
            target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
          }),
        inside: () => [...content().querySelectorAll('button')].find((b) => b.textContent === 'Inside')!,
      }
    }

    it('rests closed: a manual popover, with a trigger that says what it opens', async () => {
      const { m, content, trigger } = await setup()
      expect(content().getAttribute('popover')).toBe('manual')
      expect(content().getAttribute('role')).toBe('dialog')
      expect(content().dataset.state).toBe('closed')
      expect(shownInTopLayer(content())).toBe(false)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-controls')).toBe(content().id)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('its trigger opens it in the top layer, named by its title, with focus inside', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, toggle, inside } = await setup({ onOpenChange })
      await toggle()
      expect(shownInTopLayer(content())).toBe(true)
      expect(content().dataset.state).toBe('open')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'trigger' })
      expect(document.getElementById(content().getAttribute('aria-labelledby')!)!.textContent).toBe('Filters')
      expect(document.activeElement).toBe(inside())
    })

    it('its trigger closes it again, and focus returns to the trigger', async () => {
      const { content, trigger, toggle } = await setup()
      await toggle()
      await adapter.act(() => {
        // A press on the trigger is excluded from "outside": its click toggles.
        trigger().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
        click(trigger())
      })
      expect(shownInTopLayer(content())).toBe(false)
      expect(document.activeElement).toBe(trigger())
    })

    it('Escape and a press outside close it; a press inside does not', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, toggle, escape, press, inside } = await setup({ onOpenChange })
      await toggle()
      await escape()
      expect(shownInTopLayer(content())).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
      expect(document.activeElement).toBe(trigger())

      await toggle()
      await press(inside())
      expect(shownInTopLayer(content())).toBe(true)
      await press(document.body)
      expect(shownInTopLayer(content())).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'outside' })
    })

    it('persistent: only its trigger or close button closes it', async () => {
      const { m, content, toggle, escape, press } = await setup({ closeOnEscape: false, closeOnOutside: false, closeButton: true })
      await toggle()
      await escape()
      await press(document.body)
      expect(shownInTopLayer(content())).toBe(true)
      await adapter.act(() => click(part(m.root, 'popover', 'close')!))
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('follows open pushed by the owner', async () => {
      const { m, content } = await setup({ open: false })
      await m.update({ open: true })
      expect(shownInTopLayer(content())).toBe(true)
      await m.update({ open: false })
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('unmounted while open, it leaves nothing listening', async () => {
      const { m, toggle } = await setup()
      await toggle()
      expect(openLayerCount()).toBe(1)
      await m.unmount()
      expect(openLayerCount()).toBe(0)
    })
  })
}

/**
 * Tooltip: describes its trigger; shows on hover after a delay and on keyboard
 * focus at once; hoverable; hides on leave, blur, press and Escape.
 */
export function tooltipConformance(adapter: Adapter) {
  describe('tooltip', () => {
    const setup = async (props: Partial<TooltipProps> = {}) => {
      coolDownTooltips()
      const m = await adapter.tooltip({ content: 'Copy link', trigger: 'Copy', openDelay: 40, closeDelay: 40, ...props }, freshTarget())
      const content = () => part(m.root, 'tooltip', 'content')!
      const trigger = () => m.root.querySelector('button') as HTMLButtonElement
      // React derives enter/leave from pointerover/pointerout; Svelte and the
      // elements listen to pointerenter/pointerleave. A real pointer sends both.
      const hover = (el: Element, on: boolean) =>
        adapter.act(() => {
          el.dispatchEvent(new MouseEvent(on ? 'pointerover' : 'pointerout', { bubbles: true, relatedTarget: document.body }))
          el.dispatchEvent(new MouseEvent(on ? 'pointerenter' : 'pointerleave', { bubbles: false, relatedTarget: document.body }))
        })
      const wait = (ms: number) => adapter.act(() => {}).then(() => settle(ms)).then(() => adapter.act(() => {}))
      return { m, content, trigger, hover, wait }
    }

    it('describes its trigger, shown or not', async () => {
      const { m, content, trigger } = await setup()
      expect(content().getAttribute('role')).toBe('tooltip')
      expect(content().getAttribute('popover')).toBe('manual')
      expect(trigger().getAttribute('aria-describedby')).toBe(content().id)
      expect(content().textContent).toBe('Copy link')
      expect(shownInTopLayer(content())).toBe(false)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('shows after the pointer rests, not before', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, hover, wait } = await setup({ onOpenChange })
      await hover(trigger(), true)
      expect(shownInTopLayer(content())).toBe(false)
      await wait(80)
      expect(shownInTopLayer(content())).toBe(true)
      expect(content().dataset.state).toBe('open')
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'pointer' })
    })

    it('stays while the pointer moves onto it, and hides once it leaves both', async () => {
      const { content, trigger, hover, wait } = await setup({ openDelay: 0 })
      await hover(trigger(), true)
      expect(shownInTopLayer(content())).toBe(true)
      await hover(trigger(), false)
      await hover(content(), true)
      await wait(80)
      expect(shownInTopLayer(content())).toBe(true)
      await hover(content(), false)
      await wait(80)
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('keyboard focus shows it at once, and blur hides it', async () => {
      const { content, trigger } = await setup()
      await adapter.act(() => trigger().focus())
      expect(shownInTopLayer(content())).toBe(true)
      await adapter.act(() => trigger().blur())
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('Escape and a press on the trigger hide it at once', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger } = await setup({ onOpenChange })
      await adapter.act(() => trigger().focus())
      await adapter.act(() => {
        trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      })
      expect(shownInTopLayer(content())).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })

      await adapter.act(() => {
        trigger().blur()
        trigger().focus()
      })
      await adapter.act(() => trigger().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
      expect(shownInTopLayer(content())).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'press' })
    })

    it('disabled: nothing shows it', async () => {
      const { content, trigger, hover, wait } = await setup({ disabled: true, openDelay: 0 })
      await hover(trigger(), true)
      await adapter.act(() => trigger().focus())
      await wait(20)
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('unmounted with a delay pending, it reports nothing afterwards', async () => {
      const onOpenChange = vi.fn()
      const { m, trigger, hover } = await setup({ onOpenChange })
      await hover(trigger(), true)
      await m.unmount()
      await settle(80)
      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })
}
