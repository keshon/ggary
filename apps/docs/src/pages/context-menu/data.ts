import type { MenuEntry } from '@ggary/core/menu'

/** A file's context menu. */
export const fileMenu: MenuEntry[] = [
  { value: 'open', label: 'Open' },
  { value: 'rename', label: 'Rename', shortcut: 'F2' },
  { value: 'share', label: 'Share', disabled: true },
  { type: 'separator' },
  { value: 'delete', label: 'Delete', destructive: true, shortcut: 'Del' },
]

/**
 * A context menu opens only when it is asked for, so the page asks as it
 * loads: the keyboard's context-menu key on the target, which stands the menu
 * under it with the first row highlighted.
 */
export function stageOpen(host: HTMLElement): void {
  host
    .querySelector<HTMLElement>('[data-context-menu]')
    ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }))
}
