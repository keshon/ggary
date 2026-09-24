import { createAnatomy } from '../../types'

/**
 * A field for a time of day. The field is the quick way — type "9:30", "930",
 * "9.30pm" or "21:30", in the locale's twelve or twenty-four hours, and press
 * Enter or move on — and a list of times at a step, under it, is the browsing
 * way: it opens on the nearest time and follows what is typed. It is the ARIA
 * combobox: the focus stays in the field, and the arrows walk the list.
 */
export const timePickerAnatomy = createAnatomy('time-picker', [
  'root',
  'label',
  'control',
  'input',
  'trigger',
  'trigger-icon',
  'positioner',
  'content',
  'item',
  'error',
] as const)
export type TimePickerPart = (typeof timePickerAnatomy.parts)[number]
