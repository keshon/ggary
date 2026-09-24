import { createAnatomy } from '../../types'

/**
 * A line between two things that belong apart, across the flow or, vertical,
 * between two in a row. With a label it names what follows: "Advanced", "or".
 */
export const dividerAnatomy = createAnatomy('divider', ['root', 'label'] as const)
export type DividerPart = (typeof dividerAnatomy.parts)[number]
