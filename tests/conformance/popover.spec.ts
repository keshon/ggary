import { describe, expect, it, vi } from 'vitest'
import { coolDownTooltips } from '../../packages/core/src/components/tooltip/tooltip.machine'
import { openLayerCount } from '../../packages/core/src/utils/dismissable'
import { type Adapter, type PopoverProps, type TooltipProps, click, freshTarget, part } from './harness'

/** In a browser, the platform says; under jsdom, the shim keeps the answer. */
const shownInTopLayer = (el: Element) => {
  if (el.getAttribute('data-backend') === 'base-ui') return el.getAttribute('data-state') === 'open'
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
      const content = () => adapter.name === 'react' ? document.getElementById(trigger().id.replace('-trigger', '-content'))! : part(m.root, 'popover', 'content')!
      const isShown = () => adapter.name === 'react' ? (content() as HTMLElement).dataset.state === 'open' : shownInTopLayer(content())
      const trigger = () => m.root.querySelector('[aria-haspopup="dialog"]') as HTMLButtonElement
      return {
        m,
        content,
        isShown,
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
            if (adapter.name === 'react') { target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); click(target) }
          }),
        inside: () => [...content().querySelectorAll('button')].find((b) => b.textContent === 'Inside')!,
      }
    }

    it('rests closed with a trigger that says what it opens', async () => {
      const { m, content, trigger, isShown } = await setup()
      expect(content().getAttribute('popover')).toBe(adapter.name === 'react' ? null : 'manual')
      expect(content().getAttribute('role')).toBe('dialog')
      expect(content().dataset.state).toBe('closed')
      expect(isShown()).toBe(false)
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      expect(trigger().getAttribute('aria-controls')).toBe(adapter.name === 'react' ? null : content().id)
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('its trigger opens it, named by its title, with focus inside', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, toggle, inside, isShown } = await setup({ onOpenChange })
      await toggle()
      expect(isShown()).toBe(true)
      expect(content().dataset.state).toBe('open')
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'trigger' })
      expect(document.getElementById(content().getAttribute('aria-labelledby')!)!.textContent).toBe('Filters')
      if (adapter.name === 'react') await adapter.act(async () => settle(30))
      expect(document.activeElement).toBe(inside())
    })

    it('its trigger closes it again, and focus returns to the trigger', async () => {
      const { trigger, toggle, isShown } = await setup()
      await toggle()
      await adapter.act(() => {
        // A press on the trigger is excluded from "outside": its click toggles.
        trigger().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
        click(trigger())
      })
      expect(isShown()).toBe(false)
      if (adapter.name === 'react') await adapter.act(async () => settle(30))
      expect(document.activeElement).toBe(trigger())
    })

    it('Escape and a press outside close it; a press inside does not', async () => {
      const onOpenChange = vi.fn()
      const { content, trigger, toggle, escape, press, inside, isShown } = await setup({ onOpenChange })
      await toggle()
      await escape()
      expect(isShown()).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'escape' })
      if (adapter.name === 'react') await adapter.act(async () => settle(30))
      expect(document.activeElement).toBe(trigger())

      await toggle()
      await press(inside())
      expect(isShown()).toBe(true)
      await press(document.body)
      expect(isShown()).toBe(false)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'outside' })
    })

    it('persistent: only its trigger or close button closes it', async () => {
      const { m, content, toggle, escape, press, isShown } = await setup({ closeOnEscape: false, closeOnOutside: false, closeButton: true })
      await toggle()
      await escape()
      await press(document.body)
      expect(isShown()).toBe(true)
      await adapter.act(() => click(part(adapter.name === 'react' ? content() : m.root, 'popover', 'close') ?? content().querySelector('[data-part=close]')!))
      expect(isShown()).toBe(false)
    })

    it('follows open pushed by the owner', async () => {
      const { m, isShown } = await setup({ open: false })
      await m.update({ open: true })
      expect(isShown()).toBe(true)
      await m.update({ open: false })
      expect(isShown()).toBe(false)
    })

    it('unmounted while open, it leaves nothing listening', async () => {
      const { m, toggle } = await setup()
      await toggle()
      expect(openLayerCount()).toBe(adapter.name === 'react' ? 0 : 1)
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
      const content = () => adapter.name === 'react' ? document.getElementById(trigger().id.replace('-trigger', '-content'))! : part(m.root, 'tooltip', 'content')!
      const trigger = () => m.root.querySelector('button') as HTMLButtonElement
      // React derives enter/leave from pointerover/pointerout; Svelte and the
      // elements listen to pointerenter/pointerleave. A real pointer sends both.
      const hover = (el: Element, on: boolean, relatedTarget: Element = document.body) =>
        adapter.act(() => {
          if (adapter.name === 'react' && el.getAttribute('data-scope') === 'tooltip' && el.getAttribute('data-part') === 'content') {
            el.parentElement!.dispatchEvent(new MouseEvent(on ? 'mouseenter' : 'mouseleave', { relatedTarget }))
          }
          if (adapter.name === 'react') {
            el.dispatchEvent(new MouseEvent(on ? 'mouseover' : 'mouseout', { bubbles: true, relatedTarget }))
            el.dispatchEvent(new MouseEvent(on ? 'mouseenter' : 'mouseleave', { relatedTarget }))
            if (on) el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
          }
          el.dispatchEvent(new MouseEvent(on ? 'pointerover' : 'pointerout', { bubbles: true, relatedTarget }))
          el.dispatchEvent(new MouseEvent(on ? 'pointerenter' : 'pointerleave', { bubbles: false, relatedTarget }))
        })
      const wait = (ms: number) => adapter.act(() => {}).then(() => settle(ms)).then(() => adapter.act(() => {}))
      return { m, content, trigger, hover, wait }
    }

    it('describes its trigger, shown or not', async () => {
      const { m, content, trigger } = await setup()
      expect(content().getAttribute('role')).toBe('tooltip')
      expect(content().getAttribute('popover')).toBe(adapter.name === 'react' ? null : 'manual')
      if (adapter.name !== 'react') expect(trigger().getAttribute('aria-describedby')).toBe(content().id)
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
      expect(content().getAttribute('role')).toBe('tooltip')
      expect(trigger().getAttribute('aria-describedby')).toBe(content().id)
      expect(onOpenChange).toHaveBeenLastCalledWith(true, { reason: 'pointer' })
    })

    it('stays while the pointer moves onto it, and hides once it leaves both', async () => {
      const { content, trigger, hover, wait } = await setup({ openDelay: 0 })
      await hover(trigger(), true)
      expect(shownInTopLayer(content())).toBe(true)
      await wait(0)
      await hover(trigger(), false, content())
      await hover(content(), true, trigger())
      await wait(80)
      expect(shownInTopLayer(content())).toBe(true)
      await hover(content(), false)
      await wait(80)
      expect(shownInTopLayer(content())).toBe(false)
    })

    it('keyboard focus shows it at once, and blur hides it', async () => {
      const { content, trigger, wait } = await setup()
      await adapter.act(() => trigger().focus())
      expect(shownInTopLayer(content())).toBe(true)
      await adapter.act(() => trigger().blur())
      await wait(0)
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
