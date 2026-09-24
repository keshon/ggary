/**
 * Ctrl+K, and ⌘K on a Mac, opens the palette from anywhere in the page — and
 * closes it when it is open. Returns the cleanup.
 */
export function attachPaletteHotkey(doc: Document, toggle: () => void, key = 'k'): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.shiftKey || event.key.toLowerCase() !== key) return
    const mac = /Mac|iPhone|iPad/.test(doc.defaultView?.navigator.platform ?? '')
    if (mac ? !event.metaKey : !event.ctrlKey) return
    event.preventDefault()
    toggle()
  }
  doc.addEventListener('keydown', onKeyDown)
  return () => doc.removeEventListener('keydown', onKeyDown)
}
