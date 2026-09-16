import { createAnatomy } from '../../types'

/**
 * The chips themselves are NOT parts of this anatomy — they carry the `chip`
 * scope, so chip.css styles them identically whether they sit in a group or
 * stand alone. chip-group.css owns layout and nothing else.
 */
export const chipGroupAnatomy = createAnatomy('chip-group', ['root', 'label', 'list', 'empty'] as const)
export type ChipGroupPart = (typeof chipGroupAnatomy.parts)[number]
