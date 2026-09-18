import { createAnatomy } from '../../types'

/**
 * control is the box that looks like a field and holds the chips, the input,
 * the clear button and the chevron; the positioner and content are the list,
 * as Select's are; status is the live line a screen reader hears.
 */
export const comboboxAnatomy = createAnatomy('combobox', [
  'root',
  'label',
  'control',
  'chip',
  'chip-text',
  'chip-remove',
  'chip-remove-icon',
  'input',
  'clear',
  'clear-icon',
  'trigger',
  'trigger-icon',
  'positioner',
  'content',
  'item',
  'item-text',
  'item-description',
  'item-indicator',
  'empty',
  'more',
  'status',
] as const)
export type ComboboxPart = (typeof comboboxAnatomy.parts)[number]
