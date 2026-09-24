import { createAnatomy } from '../../types'

/**
 * A field for a day, or for a range of days, with a calendar behind a button.
 * The field is the quick way — type "18.09.2026" or "18 Sep" in the locale's
 * own order and press Enter or move on — and the calendar is the browsing way.
 * Both commit through the calendar, so a typed day and a pressed one are the
 * same choice, with the same min, max and disabled days.
 *
 * The calendar opens in a non-modal dialog under the field, with the focus on
 * the chosen day (or today). Choosing closes it and brings the focus back to
 * the field; Escape and a press outside do the same without choosing.
 */

export const datePickerAnatomy = createAnatomy('date-picker', [
  'root',
  'label',
  'control',
  'input',
  'trigger',
  'trigger-icon',
  'positioner',
  'content',
  'presets',
  'preset',
  'error',
] as const)
export type DatePickerPart = (typeof datePickerAnatomy.parts)[number]
