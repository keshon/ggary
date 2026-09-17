import { createAnatomy } from '../../types'

/** The group: its name and the layout of its options. */
export const radioGroupAnatomy = createAnatomy('radio-group', ['root', 'label', 'list'] as const)
export type RadioGroupPart = (typeof radioGroupAnatomy.parts)[number]

/**
 * Each option carries its own `radio` scope, as ChipGroup's chips carry `chip`:
 * it has Checkbox's parts, so themes style the two boxes from one rule set.
 */
export const radioAnatomy = createAnatomy('radio', ['root', 'control', 'input', 'indicator', 'label'] as const)
export type RadioPart = (typeof radioAnatomy.parts)[number]
