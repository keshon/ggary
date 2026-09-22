/**
 * Copying to the clipboard, and the answer to it.
 *
 * A clipboard shows nothing: with no answer a copy button looks the same
 * before and after a press, and a person presses it a second time. So the
 * button changes for a moment AND the result is said in words — a change of
 * glyph is an event with no content to a screen reader. Success and failure
 * take different words: one phrase for both would announce "Copied" where the
 * write was refused, the very lie that tracking a failure exists to prevent.
 *
 * Shared by CodeBlock and Copyable. The adapters keep a `CopyState` and hand
 * it to connect; everything that happens in time happens here.
 */

export type CopyStatus = 'idle' | 'copied' | 'failed'

export interface CopyState {
  status: CopyStatus
  /** What the live region says. Empty between announcements. */
  said: string
}

export interface CopyWords {
  /** The button's name, WITH what it copies: a row of plain "Copy" buttons is one word repeated by ear. */
  copy: (label: string) => string
  copied: string
  failed: string
}

export const COPY_WORDS: CopyWords = {
  copy: (label) => `Copy ${label}`,
  copied: 'Copied',
  failed: 'Could not copy',
}

export const COPY_IDLE: CopyState = { status: 'idle', said: '' }

/** How long the button shows the result: long enough to see, short enough to press again. */
export const COPY_RESULT_MS = 1500

/** `data-copied` for a state: `true`, `false`, or absent while idle. */
export const copiedAttr = (status: CopyStatus) => (status === 'copied' ? 'true' : status === 'failed' ? 'false' : undefined)

/**
 * The fallback for a missing or refusing Clipboard API — an insecure origin,
 * an old engine, a frame without the permission. The old command works only
 * on a selection, so the text is put in a textarea off the screen for as long
 * as it takes, and focus is given back afterwards.
 */
function copyBySelection(text: string, doc: Document): boolean {
  const area = doc.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  area.style.cssText = 'position:fixed;inset-block-start:0;inset-inline-start:-9999px;opacity:0'
  const focused = doc.activeElement as HTMLElement | null
  doc.body.append(area)
  area.select()
  let ok = false
  try {
    ok = doc.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  focused?.focus?.({ preventScroll: true })
  return ok
}

/** Write text to the clipboard. Resolves to whether it got there; never rejects. */
export async function writeClipboard(text: string, doc: Document = document): Promise<boolean> {
  const clipboard = doc.defaultView?.navigator.clipboard
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text)
      return true
    } catch {
      // Refused — by permission or by an insecure origin. The old way may
      // still be allowed, and answering with silence would be a lie.
    }
  }
  return copyBySelection(text, doc)
}

export interface CopyRequest {
  /** Called first. `false` means "I copy it myself": nothing is written and nothing is said. */
  onCopy?: (text: string) => boolean | void
  words?: Partial<CopyWords>
  /** The document to copy in: the button's own, which may be a frame's. */
  doc?: Document
}

export interface Copier {
  copy(text: string, request?: CopyRequest): Promise<void>
  destroy(): void
}

/**
 * One button's copying: the write, the result for `COPY_RESULT_MS`, the words.
 * `listener` receives every new state; an adapter stores it and renders.
 */
export function createCopier(listener: (state: CopyState) => void, duration = COPY_RESULT_MS): Copier {
  let reset: ReturnType<typeof setTimeout> | undefined
  let speak: ReturnType<typeof setTimeout> | undefined
  let alive = true
  // A slow write overtaken by a second press must not answer after it.
  let generation = 0

  const clear = () => {
    clearTimeout(reset)
    clearTimeout(speak)
  }

  return {
    async copy(text, request = {}) {
      if (!alive || request.onCopy?.(text) === false) return
      const mine = ++generation
      const ok = await writeClipboard(text, request.doc)
      if (!alive || mine !== generation) return
      const words = { ...COPY_WORDS, ...request.words }
      const status: CopyStatus = ok ? 'copied' : 'failed'
      clear()
      // Emptied first and filled a moment later: the same message twice is
      // otherwise not announced — the region sees no change. A timer rather
      // than a frame: a hidden tab gets no frames.
      listener({ status, said: '' })
      speak = setTimeout(() => listener({ status, said: ok ? words.copied : words.failed }), 0)
      reset = setTimeout(() => listener(COPY_IDLE), duration)
    },
    destroy() {
      alive = false
      clear()
    },
  }
}
