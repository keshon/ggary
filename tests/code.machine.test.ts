import { afterEach, describe, expect, it, vi } from 'vitest'
import { CODE_WORDS, codeLines, connect, COPY_IDLE, createCopier, writeClipboard, type CopyState } from '../packages/core/src/components/code'

const same = <T,>(props: T) => props

/**
 * A document with just enough of a clipboard for the copier: Node has no DOM,
 * and the copier reaches the clipboard only through the document it is given.
 * `execCommand` stands for the fallback's answer.
 */
function fakeDocument(writeText?: (text: string) => Promise<void>, execCommand = () => false) {
  const area = { value: '', setAttribute() {}, style: {} as Record<string, string>, select() {}, remove() {} }
  const doc = {
    defaultView: { navigator: { clipboard: writeText ? { writeText } : undefined } },
    activeElement: null,
    createElement: () => area,
    body: { append() {} },
    execCommand: vi.fn(execCommand),
  }
  return { doc: doc as unknown as Document, area, execCommand: doc.execCommand }
}

describe('code block — lines', () => {
  it('splits on newlines; a final newline ends the last line rather than opening another', () => {
    expect(codeLines('a\nb\n')).toEqual([
      { number: 1, source: 'a' },
      { number: 2, source: 'b' },
    ])
    expect(codeLines('a\r\nb', 41).map((l) => l.number)).toEqual([41, 42])
    expect(codeLines('')).toEqual([{ number: 1, source: '' }])
    // Blank lines inside are kept: they are part of the code.
    expect(codeLines('a\n\nb').map((l) => l.source)).toEqual(['a', '', 'b'])
  })

  it('numbers lines only when asked, from `start`', () => {
    expect(connect({ code: 'x\ny' }, same).lines).toEqual([])
    const api = connect({ code: 'x\ny', numbered: true, start: 41 }, same)
    expect(api.lines.map((l) => l.number)).toEqual([41, 42])
    expect(api.rootProps['data-numbered']).toBe(true)
    expect(api.lineProps(api.lines[0])).toMatchObject({ 'data-scope': 'code', 'data-part': 'line', 'data-line': 41 })
  })
})

describe('code block — props', () => {
  it('the content is a named, focusable region: a keyboard has to reach the scroll', () => {
    const api = connect({ code: 'go run .' }, same)
    expect(api.contentProps).toMatchObject({ 'data-part': 'content', role: 'region', 'aria-label': 'Code', tabIndex: 0, dir: 'ltr' })
    expect(connect({ code: 'go run .', label: 'The command' }, same).contentProps['aria-label']).toBe('The command')
  })

  it('line numbers are hidden from assistive tech', () => {
    expect(connect({ code: 'x', numbered: true }, same).lineNumberProps['aria-hidden']).toBe('true')
  })

  it('the copy button names what it copies and is a plain button', () => {
    const api = connect({ code: 'x', label: 'the command' }, same)
    expect(api.copyProps).toMatchObject({ 'data-part': 'copy', type: 'button', 'aria-label': 'Copy the command' })
    expect(api.copyProps['data-copied']).toBeUndefined()
    expect(api.copyIconProps).toMatchObject({ 'data-part': 'copy-icon', 'data-icon': 'copy', 'aria-hidden': 'true' })
    expect(connect({ code: 'x' }, same).copyProps['aria-label']).toBe(`Copy ${CODE_WORDS.label}`)
  })

  it('shows the result: data-copied and a tick on success, false on failure', () => {
    const copied = connect({ code: 'x', copy: { status: 'copied', said: 'Copied' } }, same)
    expect(copied.copyProps['data-copied']).toBe('true')
    expect(copied.copyIconProps['data-icon']).toBe('check')
    expect(copied.said).toBe('Copied')
    const failed = connect({ code: 'x', copy: { status: 'failed', said: '' } }, same)
    expect(failed.copyProps['data-copied']).toBe('false')
    expect(failed.copyIconProps['data-icon']).toBe('copy')
  })

  it('the live region is polite and atomic', () => {
    expect(connect({ code: 'x' }, same).liveProps).toMatchObject({ 'data-part': 'live', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' })
  })

  it('copies the code, or copyValue when given', () => {
    expect(connect({ code: 'a\nb' }, same).copyText).toBe('a\nb')
    expect(connect({ code: 'abbrev', copyValue: 'the whole thing' }, same).copyText).toBe('the whole thing')
  })

  it('takes words: a label and the copy phrase', () => {
    const api = connect({ code: 'x', words: { label: 'Код', copy: (l) => `Скопировать: ${l}` } }, same)
    expect(api.contentProps['aria-label']).toBe('Код')
    expect(api.copyProps['aria-label']).toBe('Скопировать: Код')
  })

  it('the press goes to the handler the adapter gave', () => {
    const press = vi.fn()
    ;(connect({ code: 'x' }, same, press).copyProps.onClick as () => void)()
    expect(press).toHaveBeenCalledOnce()
  })
})

describe('copier', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes through the Clipboard API, shows the result, says it a moment later, and resets', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn(async () => {})
    const { doc } = fakeDocument(writeText)
    const states: CopyState[] = []
    const copier = createCopier((s) => states.push(s), 1500)
    await copier.copy('a4f7c2e', { doc })
    expect(writeText).toHaveBeenCalledWith('a4f7c2e')
    // Emptied first, so the same message twice is still announced.
    expect(states).toEqual([{ status: 'copied', said: '' }])
    vi.advanceTimersByTime(0)
    expect(states.at(-1)).toEqual({ status: 'copied', said: 'Copied' })
    vi.advanceTimersByTime(1499)
    expect(states.at(-1)!.status).toBe('copied')
    vi.advanceTimersByTime(1)
    expect(states.at(-1)).toEqual(COPY_IDLE)
  })

  it('falls back to a selection when writeText rejects, and reports the fallback honestly', async () => {
    vi.useFakeTimers()
    const ok = fakeDocument(async () => Promise.reject(new Error('denied')), () => true)
    expect(await writeClipboard('x', ok.doc)).toBe(true)
    expect(ok.execCommand).toHaveBeenCalledWith('copy')
    expect(ok.area.value).toBe('x')

    const refused = fakeDocument(async () => Promise.reject(new Error('denied')), () => false)
    const states: CopyState[] = []
    await createCopier((s) => states.push(s)).copy('x', { doc: refused.doc })
    vi.advanceTimersByTime(0)
    expect(states.at(-1)).toEqual({ status: 'failed', said: 'Could not copy' })
  })

  it('uses the fallback when there is no Clipboard API at all', async () => {
    const { doc, execCommand } = fakeDocument(undefined, () => true)
    expect(await writeClipboard('x', doc)).toBe(true)
    expect(execCommand).toHaveBeenCalledOnce()
  })

  it('onCopy returning false writes nothing and says nothing', async () => {
    const writeText = vi.fn(async () => {})
    const { doc } = fakeDocument(writeText)
    const listener = vi.fn()
    const onCopy = vi.fn(() => false as const)
    await createCopier(listener).copy('secret', { doc, onCopy })
    expect(onCopy).toHaveBeenCalledWith('secret')
    expect(writeText).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
  })

  it('says its words in the language given', async () => {
    vi.useFakeTimers()
    const { doc } = fakeDocument(async () => {})
    const states: CopyState[] = []
    await createCopier((s) => states.push(s)).copy('x', { doc, words: { copied: 'Скопировано' } })
    vi.advanceTimersByTime(0)
    expect(states.at(-1)!.said).toBe('Скопировано')
  })

  it('a second press restarts the result; a destroyed copier answers nothing', async () => {
    vi.useFakeTimers()
    const { doc } = fakeDocument(async () => {})
    const states: CopyState[] = []
    const copier = createCopier((s) => states.push(s), 1500)
    await copier.copy('x', { doc })
    vi.advanceTimersByTime(1000)
    await copier.copy('x', { doc })
    vi.advanceTimersByTime(1000)
    expect(states.at(-1)!.status).toBe('copied')
    vi.advanceTimersByTime(500)
    expect(states.at(-1)).toEqual(COPY_IDLE)

    const count = states.length
    await copier.copy('x', { doc })
    copier.destroy()
    vi.advanceTimersByTime(2000)
    expect(states.length).toBe(count + 1)
  })
})
