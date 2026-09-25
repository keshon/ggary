/**
 * The bar's states on show as the page loads. A bar opens only when it is
 * used, so the page uses it: a key on an item, a held Alt.
 */

/** Opens the menu of the bar item `value`, as the Down arrow on it does: the first row is highlighted. */
export function stageOpen(host: HTMLElement, value: string): void {
  host
    .querySelector<HTMLElement>(`[data-scope="menubar"][data-part="item"][data-value="${value}"]`)
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
}

/** Underlines the access keys of a bar with `mnemonics`, as a held Alt does, until Alt is let go or the window loses focus. */
export function stageMnemonics(): void {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', altKey: true, bubbles: true }))
}
