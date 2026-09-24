import { describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, keydown, part, parts } from './harness'

/**
 * The agent layer's conversation half: a turn, the field the next one is
 * written in, the reasoning behind an answer, and the two blocks where the
 * work stops and waits for a human.
 *
 * All five are stateless but for one boolean, so the contract is the markup —
 * the parts a theme styles, the names a reader hears, and which of them are
 * shown in which state.
 */

export function turnConformance(adapter: Adapter) {
  const { turn } = adapter

  ;describe('turn', () => {
    it('reads who, when and what it cost, then the body, in that order', async () => {
      const t = await turn({ who: 'Agent', time: '14:02', tokens: 1284, duration: 4.1, locale: 'en-GB', body: 'Added.' }, freshTarget())
      const root = part(t.root, 'turn', 'root')!
      expect([...root.children].map((el) => (el as HTMLElement).dataset.part)).toEqual(['head', 'body'])
      const head = part(root, 'turn', 'head')!
      expect([...head.children].map((el) => el.textContent)).toEqual(['Agent', '14:02', '1,284 tokens · 4.1 s'])
      expect(part(root, 'turn', 'body')!.textContent).toBe('Added.')
      // Who spoke is the name in the head; the root claims no role and no name.
      expect(root.hasAttribute('role')).toBe(false)
      expect(root.hasAttribute('aria-label')).toBe(false)
      expect(t.root.querySelector('[class]')).toBeNull()
    })

    it('marks the person and leaves the machine bare', async () => {
      const t = await turn({ who: 'You', from: 'user', body: 'Add a share bar.' }, freshTarget())
      expect(part(t.root, 'turn', 'root')!.dataset.from).toBe('user')
      await t.update({ from: 'agent' })
      expect(part(t.root, 'turn', 'root')!.hasAttribute('data-from')).toBe(false)
    })

    it('a turn still arriving is busy and carries the kit’s caret inside its body', async () => {
      const t = await turn({ who: 'Agent', body: 'Working on it', streaming: true }, freshTarget())
      const root = part(t.root, 'turn', 'root')!
      expect(root.getAttribute('aria-busy')).toBe('true')
      const caret = part(root, 'caret', 'root')!
      expect(caret).not.toBeNull()
      // Flush against the last character: inside the body, and its last child.
      expect(caret.parentElement).toBe(part(root, 'turn', 'body'))
      expect(caret.getAttribute('aria-hidden')).toBe('true')

      await t.update({ streaming: false })
      expect(part(t.root, 'turn', 'root')!.hasAttribute('aria-busy')).toBe(false)
      expect(part(t.root, 'caret', 'root')).toBeNull()
    })

    it('draws no head fact it was not given, and no actions row without actions', async () => {
      const t = await turn({ who: 'Agent', body: 'Done.' }, freshTarget())
      expect(part(t.root, 'turn', 'time')).toBeNull()
      expect(part(t.root, 'turn', 'cost')).toBeNull()
      expect(part(t.root, 'turn', 'actions')).toBeNull()
      await t.update({ actions: true })
      expect(part(t.root, 'turn', 'actions')!.textContent).toBe('Copy')
    })
  })
}

export function composerConformance(adapter: Adapter) {
  const { composer } = adapter

  ;describe('composer', () => {
    const field = (root: HTMLElement) => part(root, 'textarea', 'root') as HTMLTextAreaElement

    it('is one frame: the field is a Textarea inside it, named, and the frame is not', async () => {
      const c = await composer({ label: 'Describe a task', placeholder: 'Describe a task or ask a question' }, freshTarget())
      const root = part(c.root, 'composer', 'root')!
      expect(field(root).getAttribute('aria-label')).toBe('Describe a task')
      expect(field(root).getAttribute('placeholder')).toBe('Describe a task or ask a question')
      expect(root.hasAttribute('aria-label')).toBe(false)
      // The field is a real child of the frame, so the theme's border can move outwards.
      expect(field(root).parentElement).toBe(root)
      expect(c.root.querySelector('[class]')).toBeNull()
    })

    it('rests at one line and grows to eight', async () => {
      const c = await composer({ label: 'Ask' }, freshTarget())
      expect(field(c.root).rows).toBe(1)
      expect(field(c.root).dataset.autoresize).toBe('')
      // Auto-resize turns the handle off: a grip that fights the height is undone on the next keystroke.
      expect(field(c.root).dataset.resize).toBe('none')
    })

    it('the bar stands at the field’s edge or on its own row, and says which', async () => {
      const c = await composer({ label: 'Ask' }, freshTarget())
      expect(part(c.root, 'composer', 'root')!.dataset.bar).toBe('edge')
      expect(part(c.root, 'composer', 'bar')!.dataset.bar).toBe('edge')
      await c.update({ bar: 'row' })
      expect(part(c.root, 'composer', 'root')!.dataset.bar).toBe('row')
      expect(part(c.root, 'composer', 'bar')!.dataset.bar).toBe('row')
    })

    it('sends what is in the field, and Shift+Enter does not', async () => {
      const onSend = vi.fn()
      const c = await composer({ label: 'Ask', defaultValue: 'Add a share bar', onSend }, freshTarget())
      await adapter.act(() => keydown(field(c.root), 'Enter'))
      expect(onSend).toHaveBeenCalledWith('Add a share bar')

      onSend.mockClear()
      await adapter.act(() => {
        field(c.root).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }))
      })
      expect(onSend).not.toHaveBeenCalled()
    })

    it('sends nothing when there is nothing but space in the field', async () => {
      const onSend = vi.fn()
      const c = await composer({ label: 'Ask', defaultValue: '   ', onSend }, freshTarget())
      await adapter.act(() => keydown(field(c.root), 'Enter'))
      await adapter.act(() => click(part(c.root, 'composer', 'send')!))
      expect(onSend).not.toHaveBeenCalled()
    })

    it('one control sends and stops; while it stops it is not disabled', async () => {
      const onSend = vi.fn()
      const onStop = vi.fn()
      const c = await composer({ label: 'Ask', defaultValue: 'go', onSend, onStop }, freshTarget())
      const send = () => part(c.root, 'composer', 'send') as HTMLButtonElement
      expect(send().getAttribute('aria-label')).toBe('Send')
      expect(part(c.root, 'composer', 'send-icon')!.dataset.icon).toBe('arrow-up')
      expect(send().type).toBe('button')

      await c.update({ busy: true })
      expect(send().getAttribute('aria-label')).toBe('Stop')
      expect(part(c.root, 'composer', 'send-icon')!.dataset.icon).toBe('stop')
      expect(send().disabled).toBe(false)
      await adapter.act(() => click(send()))
      expect(onStop).toHaveBeenCalledOnce()
      expect(onSend).not.toHaveBeenCalled()

      // And Enter no longer sends: there is nothing to send to.
      await adapter.act(() => keydown(field(c.root), 'Enter'))
      expect(onSend).not.toHaveBeenCalled()
    })

    it('holds the message’s other controls in the bar, before the send', async () => {
      const c = await composer({ label: 'Ask', extra: true }, freshTarget())
      const bar = part(c.root, 'composer', 'bar')!
      expect(bar.textContent).toContain('Draft')
      expect(bar.lastElementChild).toBe(part(c.root, 'composer', 'send'))
    })
  })
}

export function thinkingConformance(adapter: Adapter) {
  const { thinking } = adapter

  ;describe('thinking', () => {
    const trigger = (root: HTMLElement) => part(root, 'thinking', 'trigger') as HTMLButtonElement
    const content = (root: HTMLElement) => part(root, 'thinking', 'content')!

    it('is a disclosure that owns its region, collapsed by default', async () => {
      const t = await thinking({ body: 'One legend can key both.', duration: 4 }, freshTarget())
      expect(trigger(t.root).getAttribute('aria-expanded')).toBe('false')
      expect(trigger(t.root).getAttribute('aria-controls')).toBe(content(t.root).id)
      expect(content(t.root).getAttribute('aria-labelledby')).toBe(trigger(t.root).id)
      expect(content(t.root).hasAttribute('hidden')).toBe(true)
      expect(t.root.querySelector('[class]')).toBeNull()
    })

    it('opens and closes on a press, and says so to the owner', async () => {
      const onOpenChange = vi.fn()
      const t = await thinking({ body: 'Working.', onOpenChange }, freshTarget())
      await adapter.act(() => click(trigger(t.root)))
      expect(trigger(t.root).getAttribute('aria-expanded')).toBe('true')
      expect(content(t.root).hasAttribute('hidden')).toBe(false)
      expect(content(t.root).textContent).toContain('Working.')
      expect(onOpenChange).toHaveBeenCalledWith(true)

      await adapter.act(() => click(trigger(t.root)))
      expect(trigger(t.root).getAttribute('aria-expanded')).toBe('false')
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
    })

    it('names a duration, or says it is still coming and goes busy', async () => {
      const t = await thinking({ body: 'x', duration: 4.2, locale: 'en-GB', defaultOpen: true }, freshTarget())
      expect(part(t.root, 'thinking', 'label')!.textContent).toBe('Thought for 4.2 s')
      expect(content(t.root).hasAttribute('aria-busy')).toBe(false)
      expect(part(t.root, 'caret', 'root')).toBeNull()

      await t.update({ streaming: true })
      expect(part(t.root, 'thinking', 'label')!.textContent).toBe('Thinking…')
      expect(content(t.root).getAttribute('aria-busy')).toBe('true')
      expect(part(t.root, 'caret', 'root')).not.toBeNull()
    })

    it('carries no tone and no dot: nothing here can fail', async () => {
      const t = await thinking({ body: 'x' }, freshTarget())
      const root = part(t.root, 'thinking', 'root')!
      expect(root.hasAttribute('data-tone')).toBe(false)
      expect(part(root, 'dot', 'root')).toBeNull()
      // The kit's one disclosure glyph, not a second one.
      expect(part(root, 'thinking', 'indicator')!.dataset.icon).toBe('chevron-right')
    })

    it('a disabled one does not open', async () => {
      const t = await thinking({ body: 'x', disabled: true }, freshTarget())
      expect(trigger(t.root).disabled).toBe(true)
      await adapter.act(() => click(trigger(t.root)))
      expect(trigger(t.root).getAttribute('aria-expanded')).toBe('false')
    })
  })
}

export function approvalConformance(adapter: Adapter) {
  const { approval } = adapter
  const effects = [
    { text: 'heightmap.ts — overwrite' },
    { text: 'config.json — a change of settings', tone: 'warn' as const },
    { text: 'chunks.bin — deletion', tone: 'error' as const },
  ]

  ;describe('approval', () => {
    it('states what will be done and what it will touch BEFORE the answers', async () => {
      const a = await approval({ what: 'rm -rf build/', effects }, freshTarget())
      const root = part(a.root, 'approval', 'root')!
      expect([...root.children].map((el) => (el as HTMLElement).dataset.part)).toEqual(['head', 'what', 'effects', 'actions'])
      expect(part(root, 'approval', 'title')!.textContent).toBe('Confirmation is required')
      expect(part(root, 'approval', 'what')!.textContent).toBe('rm -rf build/')
      expect(a.root.querySelector('[class]')).toBeNull()
    })

    it('is a group named by its heading, and reaches a live region while it waits', async () => {
      const a = await approval({ what: 'rm -rf build/' }, freshTarget())
      const root = part(a.root, 'approval', 'root')!
      expect(root.getAttribute('role')).toBe('group')
      expect(root.getAttribute('aria-labelledby')).toBe(part(root, 'approval', 'title')!.id)
      expect(root.getAttribute('aria-live')).toBe('polite')
      await a.update({ live: 'assertive' })
      expect(part(a.root, 'approval', 'root')!.getAttribute('aria-live')).toBe('assertive')
    })

    it('marks the irreversible by tone and by word, and names the count', async () => {
      const a = await approval({ what: 'rm -rf build/', effects }, freshTarget())
      const list = part(a.root, 'approval', 'effects')!
      expect(list.tagName).toBe('UL')
      expect(list.getAttribute('aria-label')).toBe('It will touch 3')
      const items = parts(a.root, 'approval', 'effect')
      expect(items.map((el) => el.dataset.tone)).toEqual([undefined, 'warn', 'error'])
      // Never colour alone: the word says it too.
      expect(items[2].textContent).toContain('deletion')
    })

    it('answers in one press; denial is a button beside allow, never in a menu', async () => {
      const onDecide = vi.fn()
      const a = await approval({ what: 'rm -rf build/', onDecide }, freshTarget())
      const buttons = [...part(a.root, 'approval', 'actions')!.querySelectorAll('button')]
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Allow', 'Deny'])
      // Allow is the principal one, and it stands first.
      expect(buttons[0].dataset.emphasis).toBe('high')
      await adapter.act(() => click(buttons[1]))
      expect(onDecide).toHaveBeenCalledWith('denied')
    })

    it('steps back once answered: the actions go, the record stays, the question does not', async () => {
      const a = await approval({ what: 'rm -rf build/', effects, decidedBy: 'Anna', decidedAt: '14:32' }, freshTarget())
      await a.update({ state: 'approved' })
      const root = part(a.root, 'approval', 'root')!
      expect(root.dataset.state).toBe('approved')
      expect(part(root, 'approval', 'actions')).toBeNull()
      expect(part(root, 'approval', 'verdict')!.textContent).toBe('Allowed by Anna at 14:32')
      // What was allowed is still there to be checked an hour later.
      expect(part(root, 'approval', 'what')!.textContent).toBe('rm -rf build/')
      expect(root.hasAttribute('aria-live')).toBe(false)
    })

    it('takes a third way out without losing the second', async () => {
      const a = await approval({ what: 'rm -rf build/', extra: true }, freshTarget())
      const buttons = [...part(a.root, 'approval', 'actions')!.querySelectorAll('button')]
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Allow', 'Deny', 'Always allow'])
    })
  })
}

export function failureConformance(adapter: Adapter) {
  const { failure } = adapter
  const base = { title: 'Could not read terrain/chunks.bin', code: 'EBUSY', reason: 'The file is locked by another process' }
  const tried = ['A retry after 1 s — the same code', 'A retry after 4 s — the same code']

  ;describe('failure', () => {
    it('says what failed, why with its code, what was tried and the way out', async () => {
      const f = await failure({ ...base, tried }, freshTarget())
      const root = part(f.root, 'failure', 'root')!
      expect([...root.children].map((el) => (el as HTMLElement).dataset.part)).toEqual(['head', 'reason', 'tried', 'actions'])
      expect(part(root, 'failure', 'title')!.textContent).toBe(base.title)
      expect(part(root, 'failure', 'reason')!.textContent).toBe('The file is locked by another process (EBUSY)')
      expect(f.root.querySelector('[class]')).toBeNull()
    })

    it('interrupts while it is pending, with a glyph as well as a colour', async () => {
      const f = await failure(base, freshTarget())
      const root = part(f.root, 'failure', 'root')!
      expect(root.getAttribute('role')).toBe('alert')
      expect(part(root, 'failure', 'icon')!.dataset.icon).toBe('status-error')
      expect(part(root, 'failure', 'icon')!.getAttribute('aria-hidden')).toBe('true')
      await f.update({ live: 'polite' })
      expect(part(f.root, 'failure', 'root')!.getAttribute('aria-live')).toBe('polite')
    })

    it('names how many attempts there already were', async () => {
      const f = await failure({ ...base, tried }, freshTarget())
      const list = part(f.root, 'failure', 'tried')!
      expect(list.tagName).toBe('UL')
      expect(list.getAttribute('aria-label')).toBe('Already tried: 2')
      expect(parts(f.root, 'failure', 'attempt').map((el) => el.textContent)).toEqual(tried)
      await f.update({ tried: [] })
      expect(part(f.root, 'failure', 'tried')).toBeNull()
    })

    it('always offers a way out while pending', async () => {
      const onRetry = vi.fn()
      const f = await failure({ ...base, onRetry, extra: true }, freshTarget())
      const buttons = [...part(f.root, 'failure', 'actions')!.querySelectorAll('button')]
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Retry', 'Skip the file'])
      expect(buttons[0].dataset.emphasis).toBe('high')
      await adapter.act(() => click(buttons[0]))
      expect(onRetry).toHaveBeenCalledOnce()
    })

    it('steps back once resolved or given up, and the reason stays readable', async () => {
      const f = await failure({ ...base, tried, resolvedAt: '14:33' }, freshTarget())
      await f.update({ state: 'resolved' })
      let root = part(f.root, 'failure', 'root')!
      expect(root.dataset.state).toBe('resolved')
      expect(root.hasAttribute('role')).toBe(false)
      expect(part(root, 'failure', 'actions')).toBeNull()
      expect(part(root, 'failure', 'verdict')!.textContent).toBe('Resolved at 14:33')

      await f.update({ state: 'given-up' })
      root = part(f.root, 'failure', 'root')!
      expect(root.dataset.state).toBe('given-up')
      expect(part(root, 'failure', 'reason')!.textContent).toContain('EBUSY')
    })
  })
}
