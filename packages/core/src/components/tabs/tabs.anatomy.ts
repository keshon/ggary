import { createAnatomy } from '../../types'

export const tabsAnatomy = createAnatomy('tabs', ['root', 'list', 'tab', 'tab-text', 'close', 'close-icon', 'panel'] as const)

export type TabsPart = (typeof tabsAnatomy.parts)[number]
