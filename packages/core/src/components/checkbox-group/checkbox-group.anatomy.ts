import { createAnatomy } from '../../types'

/** The group: its name and the layout of its options. The options are `checkbox` parts. */
export const checkboxGroupAnatomy = createAnatomy('checkbox-group', ['root', 'label', 'list'] as const)
export type CheckboxGroupPart = (typeof checkboxGroupAnatomy.parts)[number]
