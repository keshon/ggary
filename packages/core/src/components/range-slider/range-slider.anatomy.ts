import { createAnatomy } from '../../types'

/**
 * Two native range inputs over one drawn track, each moving one end: the
 * keys, the step, the slider role and the form value stay the browser's. The
 * inputs take no pointer themselves; their thumbs do. The track under them
 * takes a press and moves the nearer thumb there. Over it all: the label and
 * the range in words, or a bubble on each thumb, or two fields under it.
 */
export const rangeSliderAnatomy = createAnatomy('range-slider', [
  'root',
  'header',
  'label',
  'value',
  'bubbles',
  'bubble',
  'control',
  'track',
  'range',
  'thumb',
  'marks',
  'mark',
  'fields',
  'separator',
] as const)
export type RangeSliderPart = (typeof rangeSliderAnatomy.parts)[number]
