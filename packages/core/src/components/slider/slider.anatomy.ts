import { createAnatomy } from '../../types'

/** A native range input, and the number beside it. */
export const sliderAnatomy = createAnatomy('slider', ['root', 'input', 'output'] as const)
export type SliderPart = (typeof sliderAnatomy.parts)[number]
