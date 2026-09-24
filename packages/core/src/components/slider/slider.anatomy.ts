import { createAnatomy } from '../../types'

/** A native range input, the number beside it, and labelled marks under it. */
export const sliderAnatomy = createAnatomy('slider', ['root', 'input', 'output', 'marks', 'mark'] as const)
export type SliderPart = (typeof sliderAnatomy.parts)[number]
