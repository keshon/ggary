import { createAnatomy } from '../../types'

export const selectAnatomy = createAnatomy('select', [
  'root',
  'label',
  'trigger',
  'value',
  'indicator',
  'positioner',
  'content',
  'item',
  'item-text',
  'item-indicator',
  'empty',
] as const)

export type SelectPart = (typeof selectAnatomy.parts)[number]
