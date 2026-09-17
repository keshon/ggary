import { createAnatomy } from '../../types'

/**
 * `content` is the floating element itself, as Popover's is: it carries
 * `popover` and `role="menu"`. The trigger is not a part — it belongs to
 * whatever component renders it.
 */
export const menuAnatomy = createAnatomy('menu', [
  'content',
  'group',
  'group-label',
  'separator',
  'item',
  'item-text',
  'item-shortcut',
  'item-indicator',
  'submenu-indicator',
] as const)

export type MenuPart = (typeof menuAnatomy.parts)[number]
