import { createAnatomy } from '../../types'

/**
 * A menu for any element, opened the ways a desktop opens one: a right click
 * stands it at the pointer, Shift+F10 or the menu key under the focused
 * element. Shift and a right click still give the browser's own menu. The menu
 * is a Menu; the target stays the caller's element and takes no scope of the
 * kit's — only `data-context-menu`, open or closed, so a row can stay marked
 * while its menu is out.
 */
export const contextMenuAnatomy = createAnatomy('context-menu', ['target'] as const)
export type ContextMenuPart = (typeof contextMenuAnatomy.parts)[number]
