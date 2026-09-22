import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Adapter, click, freshTarget, part, parts } from './harness'

/**
 * A stand-in clipboard. The platform's own needs a permission and a trusted
 * gesture, neither of which a test has; what is under test is what the
 * component does with the answer.
 */
function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}
function stubExecCommand(answer: boolean) {
  const spy = vi.fn(() => answer)
  Object.defineProperty(document, 'execCommand', { value: spy, configurable: true, writable: true })
  return spy
}
function restore() {
  // Own properties shadow the platform's getter; deleting them brings it back.
  delete (navigator as { clipboard?: unknown }).clipboard
  delete (document as { execCommand?: unknown }).execCommand
}

/**
 * CodeBlock and Copyable: the markup a theme styles and a screen reader reads,
 * and the copy — written, shown on the button, said in words, and undone.
 */
export function codeConformance(adapter: Adapter) {
  const mountCode = adapter.codeBlock
  ;(mountCode ? describe : describe.skip)('code block', () => {
    afterEach(restore)

    it('is a named region with a tab stop, so the sideways scroll is reachable', async () => {
      const m = await mountCode!({ code: 'go -C tools run ./cmd/contrast' }, freshTarget())
      const content = part(m.root, 'code', 'content')!
      expect(content.getAttribute('role')).toBe('region')
      expect(content.getAttribute('aria-label')).toBe('Code')
      expect(content.tabIndex).toBe(0)
      expect(content.textContent).toBe('go -C tools run ./cmd/contrast')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('the copy button is always there, named with what it copies; the live region starts empty', async () => {
      const m = await mountCode!({ code: 'x', label: 'the command' }, freshTarget())
      const copy = part(m.root, 'code', 'copy') as HTMLButtonElement
      expect(copy.tagName).toBe('BUTTON')
      expect(copy.type).toBe('button')
      expect(copy.getAttribute('aria-label')).toBe('Copy the command')
      expect(copy.hasAttribute('data-copied')).toBe(false)
      const icon = part(copy, 'code', 'copy-icon')!
      expect(icon.dataset.icon).toBe('copy')
      expect(icon.getAttribute('aria-hidden')).toBe('true')
      const live = part(m.root, 'code', 'live')!
      expect(live.getAttribute('aria-live')).toBe('polite')
      expect(live.textContent).toBe('')
    })

    it('numbered: a line per line, counted from start, the numbers hidden from assistive tech', async () => {
      const m = await mountCode!({ code: 'const size = 256;\nlet seed = 1;\nreturn size;\n', numbered: true, start: 41 }, freshTarget())
      const lines = parts(m.root, 'code', 'line')
      expect(lines).toHaveLength(3)
      const numbers = parts(m.root, 'code', 'line-number')
      expect(numbers.map((n) => n.textContent)).toEqual(['41', '42', '43'])
      expect(numbers.every((n) => n.getAttribute('aria-hidden') === 'true')).toBe(true)
      expect(parts(m.root, 'code', 'line-source')[1].textContent).toBe('let seed = 1;')
      await m.update({ start: 1 })
      expect(parts(m.root, 'code', 'line-number')[0].textContent).toBe('1')
    })

    it('a press copies, shows it, says it, and lets go after a moment', async () => {
      const writeText = vi.fn(async () => {})
      stubClipboard(writeText)
      const m = await mountCode!({ code: 'npm test' }, freshTarget())
      const copy = () => part(m.root, 'code', 'copy')!
      await adapter.act(() => click(copy()))
      await adapter.wait(20)
      expect(writeText).toHaveBeenCalledWith('npm test')
      expect(copy().dataset.copied).toBe('true')
      expect(part(copy(), 'code', 'copy-icon')!.dataset.icon).toBe('check')
      expect(part(m.root, 'code', 'live')!.textContent).toBe('Copied')
      await adapter.wait(1600)
      expect(copy().hasAttribute('data-copied')).toBe(false)
      expect(part(copy(), 'code', 'copy-icon')!.dataset.icon).toBe('copy')
      expect(part(m.root, 'code', 'live')!.textContent).toBe('')
    })

    it('copies copyValue when given; onCopy returning false writes nothing', async () => {
      const writeText = vi.fn(async () => {})
      stubClipboard(writeText)
      const onCopy = vi.fn(() => false as const)
      const m = await mountCode!({ code: 'short', copyValue: 'the long one', onCopy }, freshTarget())
      await adapter.act(() => click(part(m.root, 'code', 'copy')!))
      await adapter.wait(20)
      expect(onCopy).toHaveBeenCalledWith('the long one')
      expect(writeText).not.toHaveBeenCalled()
      expect(part(m.root, 'code', 'copy')!.hasAttribute('data-copied')).toBe(false)
      expect(part(m.root, 'code', 'live')!.textContent).toBe('')
    })
  })

  const mountCopyable = adapter.copyable
  ;(mountCopyable ? describe : describe.skip)('copyable', () => {
    afterEach(restore)

    it('a value and a button in the flow, the button named with the value', async () => {
      const m = await mountCopyable!({ value: 'a4f7c2e' }, freshTarget())
      expect(part(m.root, 'copyable', 'value')!.textContent).toBe('a4f7c2e')
      const copy = part(m.root, 'copyable', 'copy') as HTMLButtonElement
      expect(copy.type).toBe('button')
      expect(copy.getAttribute('aria-label')).toBe('Copy a4f7c2e')
      // The glyph is a child: a mask on the button would clip its tap area.
      expect(copy.hasAttribute('data-icon')).toBe(false)
      expect(part(copy, 'copyable', 'copy-icon')!.dataset.icon).toBe('copy')
      expect(m.root.querySelector('[class]')).toBeNull()
    })

    it('copies the full value behind an abbreviation', async () => {
      const writeText = vi.fn(async () => {})
      stubClipboard(writeText)
      const m = await mountCopyable!({ value: 'a4f7c2e', copyValue: 'a4f7c2e91b0d5537' }, freshTarget())
      await adapter.act(() => click(part(m.root, 'copyable', 'copy')!))
      await adapter.wait(20)
      expect(writeText).toHaveBeenCalledWith('a4f7c2e91b0d5537')
      expect(part(m.root, 'copyable', 'copy')!.dataset.copied).toBe('true')
      expect(part(m.root, 'copyable', 'live')!.textContent).toBe('Copied')
    })

    it('a refused write that the fallback cannot save is shown and said as a failure', async () => {
      stubClipboard(async () => Promise.reject(new Error('denied')))
      const execCommand = stubExecCommand(false)
      const m = await mountCopyable!({ value: 'v', words: { failed: 'Не скопировано' } }, freshTarget())
      await adapter.act(() => click(part(m.root, 'copyable', 'copy')!))
      await adapter.wait(20)
      expect(execCommand).toHaveBeenCalledWith('copy')
      expect(part(m.root, 'copyable', 'copy')!.dataset.copied).toBe('false')
      expect(part(m.root, 'copyable', 'live')!.textContent).toBe('Не скопировано')
    })
  })
}
