import { createAnatomy } from '../../types'

/** Checkbox's shape, with a thumb where the checkbox has its mark. The input is the track. */
export const switchAnatomy = createAnatomy('switch', ['root', 'control', 'toggle', 'input', 'thumb', 'label'] as const)
export type SwitchPart = (typeof switchAnatomy.parts)[number]
