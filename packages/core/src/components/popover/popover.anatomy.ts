import { createAnatomy } from '../../types'

/**
 * `content` is the floating element itself: it carries `popover`, and Floating
 * UI places it. As with Dialog, the trigger is not a part — it belongs to
 * whatever component renders it.
 */
export const popoverAnatomy = createAnatomy('popover', ['content', 'title', 'close', 'close-icon'] as const)
export type PopoverPart = (typeof popoverAnatomy.parts)[number]
