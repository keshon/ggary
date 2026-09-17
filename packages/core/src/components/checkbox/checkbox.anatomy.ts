import { createAnatomy } from '../../types'

/** A <label> root, a control stacking the native input and the drawn mark, and the text. */
export const checkboxAnatomy = createAnatomy('checkbox', ['root', 'control', 'input', 'indicator', 'label'] as const)
export type CheckboxPart = (typeof checkboxAnatomy.parts)[number]
