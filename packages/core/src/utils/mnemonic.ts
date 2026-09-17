/**
 * Access keys, as desktop toolkits write them: `&File` underlines F and answers
 * Alt+F; `&&` is a literal ampersand. Pure.
 */
export interface Mnemonic {
  /** The label without its markers. */
  text: string
  /** The marked character's index in `text`, or -1. */
  index: number
  /** The marked character, or null. */
  key: string | null
}

export function parseMnemonic(label: string): Mnemonic {
  let text = ''
  let index = -1
  for (let i = 0; i < label.length; i++) {
    const char = label[i]
    if (char === '&' && i + 1 < label.length) {
      i++
      if (label[i] !== '&' && index === -1) index = text.length
      text += label[i]
    } else {
      text += char
    }
  }
  return { text, index, key: index === -1 ? null : text[index] }
}

/** Whether a key press names this access key: by the character typed, or by the physical Latin key. */
export function matchesMnemonic(mnemonic: string | null, key: string, code?: string): boolean {
  if (!mnemonic) return false
  const wanted = mnemonic.toLocaleLowerCase()
  if (key.toLocaleLowerCase() === wanted) return true
  // On a Cyrillic layout Alt+F types "а"; the physical key is still KeyF.
  const letter = code?.match(/^Key([A-Z])$/)?.[1]
  return !!letter && letter.toLowerCase() === wanted
}

export interface MenubarKeyHandlers {
  /** Alt with a character. Return true when it opened something, so the key is consumed. */
  onMnemonic: (key: string, code: string) => boolean
  /** Alt pressed or released, or the window lost focus while it was held. */
  onShowMnemonics: (show: boolean) => void
  /** F10: go to the bar. */
  onFocusBar: () => void
}

/**
 * The page-wide keys of a menubar: Alt+key opens a menu by its access key, a
 * held Alt underlines the keys, and F10 moves focus to the bar. Opt-in: on a
 * web page these keys may belong to the browser or to the page.
 */
export function attachMenubarKeys(doc: Document, handlers: MenubarKeyHandlers): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Alt' && !event.ctrlKey && !event.metaKey) {
      handlers.onShowMnemonics(true)
      return
    }
    if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.length === 1) {
      if (handlers.onMnemonic(event.key, event.code)) event.preventDefault()
      return
    }
    if (event.key === 'F10' && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      event.preventDefault()
      handlers.onFocusBar()
    }
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt') handlers.onShowMnemonics(false)
  }
  const onBlur = () => handlers.onShowMnemonics(false)
  const view = doc.defaultView
  doc.addEventListener('keydown', onKeyDown)
  doc.addEventListener('keyup', onKeyUp)
  view?.addEventListener('blur', onBlur)
  return () => {
    doc.removeEventListener('keydown', onKeyDown)
    doc.removeEventListener('keyup', onKeyUp)
    view?.removeEventListener('blur', onBlur)
  }
}
