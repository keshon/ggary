import { createAnatomy } from '../../types'

/** The group is the field's box; the control inside hands its border outwards. */
export const inputGroupAnatomy = createAnatomy('input-group', ['root', 'prefix', 'suffix'] as const)
export type InputGroupPart = (typeof inputGroupAnatomy.parts)[number]
