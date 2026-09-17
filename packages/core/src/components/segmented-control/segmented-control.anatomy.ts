import { createAnatomy } from '../../types'

/** root is the radiogroup; each item is a <label> around a native radio and its text. */
export const segmentedControlAnatomy = createAnatomy('segmented-control', ['root', 'item', 'input', 'text'] as const)
export type SegmentedControlPart = (typeof segmentedControlAnatomy.parts)[number]
