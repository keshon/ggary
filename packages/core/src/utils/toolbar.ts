/**
 * The keyboard of a `role="toolbar"`: one tab stop for the strip, and the arrow
 * keys between the tools. The tools are whatever the page put there, so this
 * reads the DOM rather than holding a list of its own — a machine would need
 * the application to declare its buttons twice.
 */

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** The tools, in order, skipping the unavailable ones. */
export function toolbarItems(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true'
  )
}

/**
 * Attach the arrows. The tab stop follows the last tool used, which is what a
 * toolbar is for: come back with Tab and you are where you left off.
 */
export function attachToolbarKeys(root: HTMLElement, orientation: 'horizontal' | 'vertical' = 'horizontal'): () => void {
  const previousKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'

  const sync = () => {
    const items = toolbarItems(root)
    if (items.length === 0) return
    const active = items.find((item) => item === document.activeElement)
    const stop = active ?? items.find((item) => item.tabIndex === 0) ?? items[0]
    for (const item of items) item.tabIndex = item === stop ? 0 : -1
  }

  const move = (from: HTMLElement, delta: number) => {
    const items = toolbarItems(root)
    const index = items.indexOf(from)
    if (index === -1) return
    // Wraps: a strip has two ends and no beginning to get stuck against.
    const next = items[(index + delta + items.length) % items.length]
    next.tabIndex = 0
    from.tabIndex = -1
    next.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement
    if (!root.contains(target)) return
    // A text field inside the strip keeps its own arrows: they move the caret.
    if (target.matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select')) return
    const items = toolbarItems(root)
    if (event.key === previousKey) move(target, -1)
    else if (event.key === nextKey) move(target, 1)
    else if (event.key === 'Home') items[0]?.focus()
    else if (event.key === 'End') items[items.length - 1]?.focus()
    else return
    event.preventDefault()
    sync()
  }

  const onFocusIn = () => sync()

  sync()
  root.addEventListener('keydown', onKeyDown)
  root.addEventListener('focusin', onFocusIn)
  // Tools come and go — a mode appears, a counter is added — and a strip whose
  // new button kept tabindex 0 would have two tab stops.
  const observer = new MutationObserver(sync)
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-disabled'] })

  return () => {
    root.removeEventListener('keydown', onKeyDown)
    root.removeEventListener('focusin', onFocusIn)
    observer.disconnect()
  }
}
