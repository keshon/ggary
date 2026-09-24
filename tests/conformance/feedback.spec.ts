import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

const key = (target: Element, name: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }))
const rightClick = (target: Element, init: MouseEventInit = {}) =>
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 30, ...init }))

/**
 * Result, Popconfirm and ContextMenu: how something ended, a question before
 * an action, and a menu for any element. What the browser run adds is the
 * real focus and placement; this is the markup and what each event does.
 */
export function feedbackConformance(adapter: Adapter) {
  describe('result', () => {
    it('is a heading in the tone’s glyph, its line, its next step and its detail', async () => {
      const m = await adapter.result(
        { tone: 'ok', title: 'Payment sent', description: '€420 to Acme GmbH.', actions: ['Back to invoices'], details: 'Reference 2026-0915' },
        freshTarget()
      )
      const root = part(m.root, 'result', 'root')!
      expect(root.dataset.tone).toBe('ok')
      expect(part(root, 'result', 'icon')!.getAttribute('data-icon')).toBe('status-ok')
      expect(part(root, 'result', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      const title = part(root, 'result', 'title')!
      expect([title.tagName, title.textContent]).toEqual(['H2', 'Payment sent'])
      expect(part(root, 'result', 'description')!.textContent).toBe('€420 to Acme GmbH.')
      expect(part(root, 'result', 'actions')!.querySelector('button')!.textContent).toBe('Back to invoices')
      expect(part(root, 'result', 'details')!.textContent).toBe('Reference 2026-0915')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('draws an error page’s code in place of the glyph, for the eye alone, at the heading level asked', async () => {
      const m = await adapter.result({ tone: 'error', code: '404', title: 'Page not found', headingLevel: 1, live: 'polite' }, freshTarget())
      const root = part(m.root, 'result', 'root')!
      expect(part(root, 'result', 'icon')).toBeNull()
      expect(part(root, 'result', 'code')!.textContent).toBe('404')
      expect(part(root, 'result', 'code')!.getAttribute('aria-hidden')).toBe('true')
      expect(part(root, 'result', 'title')!.tagName).toBe('H1')
      expect(root.getAttribute('role')).toBe('status')
      expect(part(root, 'result', 'actions')).toBeNull()
    })
  })

  describe('popconfirm', () => {
    const setup = async (props: Partial<Parameters<Adapter['popconfirm']>[0]> = {}) => {
      const m = await adapter.popconfirm({ triggerLabel: 'Delete', title: 'Delete this lead?', ...props }, freshTarget())
      const trigger = () => m.root.querySelector('button')!
      const content = () => part(m.root, 'popconfirm', 'content')!
      const answer = (which: 'cancel' | 'confirm') => content().querySelector<HTMLButtonElement>(`[data-answer='${which}']`)!
      return { m, trigger, content, answer }
    }

    it('opens from its trigger as an alert dialog named by its question, with two answers', async () => {
      const { m, trigger, content, answer } = await setup({ description: 'Its history goes with it.', confirmLabel: 'Delete' })
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
      await adapter.act(() => click(trigger()))
      expect(trigger().getAttribute('aria-expanded')).toBe('true')
      expect(content().getAttribute('role')).toBe('alertdialog')
      expect(document.getElementById(content().getAttribute('aria-labelledby')!)!.textContent).toBe('Delete this lead?')
      expect(document.getElementById(content().getAttribute('aria-describedby')!)!.textContent).toBe('Its history goes with it.')
      expect([answer('cancel').textContent!.trim(), answer('confirm').textContent!.trim()]).toEqual(['Cancel', 'Delete'])
      expect(answer('cancel').dataset.scope).toBe('button')
      void m
    })

    it('marks the safe answer for the focus when the action destroys, and the action otherwise', async () => {
      const destroys = await setup({ destructive: true })
      await adapter.act(() => click(destroys.trigger()))
      expect(destroys.answer('cancel').hasAttribute('data-autofocus')).toBe(true)
      expect(destroys.answer('confirm').hasAttribute('data-destructive')).toBe(true)
      await adapter.act(() => click(destroys.answer('cancel')))
      const plain = await setup()
      await adapter.act(() => click(plain.trigger()))
      expect(plain.answer('confirm').hasAttribute('data-autofocus')).toBe(true)
    })

    it('shows busy while the action runs and closes when it is done', async () => {
      let finish!: () => void
      const onConfirm = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
      const { trigger, answer, content } = await setup({ onConfirm })
      await adapter.act(() => click(trigger()))
      await adapter.act(() => click(answer('confirm')))
      expect(answer('confirm').getAttribute('aria-busy')).toBe('true')
      expect(answer('confirm').disabled).toBe(false)
      await adapter.act(() => click(answer('confirm')))
      expect(onConfirm).toHaveBeenCalledTimes(1)
      finish()
      await adapter.wait(0)
      expect(content().dataset.state).toBe('closed')
      expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('stays open on a failure and says it, as an alert the dialog is described by', async () => {
      const { trigger, answer, content } = await setup({ onConfirm: () => Promise.reject(new Error('The lead is locked')) })
      await adapter.act(() => click(trigger()))
      await adapter.act(() => click(answer('confirm')))
      await adapter.wait(0)
      const error = part(content(), 'popconfirm', 'error')!
      expect(error.textContent).toBe('The lead is locked')
      expect(error.getAttribute('role')).toBe('alert')
      expect(content().getAttribute('aria-describedby')).toContain(error.id)
      expect(content().dataset.state).toBe('open')
    })

    it('Cancel closes it and is heard as a cancel', async () => {
      const onCancel = vi.fn()
      const onOpenChange = vi.fn()
      const { trigger, answer } = await setup({ onCancel, onOpenChange })
      await adapter.act(() => click(trigger()))
      await adapter.act(() => click(answer('cancel')))
      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onOpenChange).toHaveBeenLastCalledWith(false, { reason: 'cancel' })
    })
  })

  describe('context menu', () => {
    const items = [
      { value: 'rename', label: 'Rename' },
      { value: 'delete', label: 'Delete', destructive: true },
    ]
    const setup = async (onSelect = vi.fn()) => {
      const m = await adapter.contextMenu({ targetLabel: 'report.pdf', items, onSelect }, freshTarget())
      const target = () => m.root.querySelector<HTMLElement>('[data-context-menu]')!
      const menu = () => part(m.root, 'menu', 'content')!
      return { m, target, menu, onSelect }
    }

    it('leaves the target the caller’s own, marked only by whether its menu is out', async () => {
      const { target } = await setup()
      expect(target().textContent).toBe('report.pdf')
      expect(target().hasAttribute('data-scope')).toBe(false)
      expect(target().dataset.contextMenu).toBe('closed')
      expect(target().getAttribute('aria-keyshortcuts')).toBe('Shift+F10')
    })

    it('opens on a right click, in place of the browser’s menu', async () => {
      const { target, menu } = await setup()
      let prevented = false
      await adapter.act(() => {
        prevented = !rightClick(target())
      })
      expect(prevented).toBe(true)
      expect(target().dataset.contextMenu).toBe('open')
      expect(menu().dataset.state).toBe('open')
      expect(parts(menu(), 'menu', 'item').map((item) => item.textContent!.trim())).toEqual(['Rename', 'Delete'])
    })

    it('leaves Shift and a right click to the browser', async () => {
      const { target, menu } = await setup()
      let prevented = false
      await adapter.act(() => {
        prevented = !rightClick(target(), { shiftKey: true })
      })
      expect(prevented).toBe(false)
      expect(menu().dataset.state).toBe('closed')
    })

    it('opens from the keyboard — Shift+F10 or the menu key — on the first item, and a choice is heard', async () => {
      const { target, menu, onSelect } = await setup()
      await adapter.act(() => key(target(), 'F10', { shiftKey: true }))
      expect(menu().dataset.state).toBe('open')
      await adapter.act(() => click(parts(menu(), 'menu', 'item')[0]))
      expect(onSelect).toHaveBeenCalledWith('rename', expect.anything())
      await adapter.act(() => key(target(), 'ContextMenu'))
      expect(menu().dataset.state).toBe('open')
      await adapter.act(() => key(target(), 'F10'))
      expect(target().dataset.contextMenu).toBe('open')
    })
  })
}
