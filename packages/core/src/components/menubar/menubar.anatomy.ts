import { createAnatomy } from '../../types'

/** The bar and its items. Each open menu is the Menu's own anatomy, under `menu`. */
export const menubarAnatomy = createAnatomy('menubar', ['root', 'item', 'item-text', 'mnemonic'] as const)

export type MenubarPart = (typeof menubarAnatomy.parts)[number]
