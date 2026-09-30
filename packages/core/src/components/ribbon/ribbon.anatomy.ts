import { createAnatomy } from '../../types'

/**
 * A ribbon: tabbed panels of dense tools, after the 3ds Max ribbon.
 *
 * The top row is a tab list (one tab stop, arrows move and choose). Each
 * panel holds groups, and each group is its own `toolbar` — one tab stop
 * per group, arrows between the tools the page put there. The tools
 * themselves are the kit's own controls (Button, Select, …), never
 * ribbon-only copies: density comes from the group's layout, not from
 * a second set of components.
 */
export const ribbonAnatomy = createAnatomy(
  'ribbon',
  ['root', 'tab-list', 'tab', 'tab-text', 'panel', 'group', 'group-body', 'group-label', 'separator', 'tool'] as const
)

export type RibbonPart = (typeof ribbonAnatomy.parts)[number]
