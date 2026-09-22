import { createAnatomy } from '../../types'

/**
 * The side column: groups of links, each group named. An item with sections
 * of its own stands in a `branch`, beside the `toggle` that opens its
 * `subitems`.
 */
export const navAnatomy = createAnatomy('nav', ['root', 'group', 'group-label', 'item', 'icon', 'count', 'branch', 'toggle', 'toggle-icon', 'subitems'] as const)
export type NavPart = (typeof navAnatomy.parts)[number]
