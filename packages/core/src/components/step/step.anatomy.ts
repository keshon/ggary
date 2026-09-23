import { createAnatomy } from '../../types'

/**
 * The head is a `<summary>` and the root a `<details>`: the parts below are
 * what stands inside them. The state dot is NOT a part of a step — the kit's
 * StatusDot goes in the head and reads the tone the root sets.
 */
export const stepAnatomy = createAnatomy('step', [
  'root',
  'head',
  'indicator',
  'name',
  'argument',
  'meta',
  'status',
  'body',
  'output',
  'output-body',
  'more',
] as const)
export type StepPart = (typeof stepAnatomy.parts)[number]
