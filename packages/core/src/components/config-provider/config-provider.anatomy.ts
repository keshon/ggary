import { createAnatomy } from '../../types'

/**
 * One element with no box of its own (`display: contents`) that carries the
 * settings the DOM itself understands — `lang`, `dir` and the theme's
 * `data-mode` — so they reach everything under it, overlays included: a
 * popover or a dialog is drawn in the top layer but stays in the DOM here.
 */
export const configProviderAnatomy = createAnatomy('config-provider', ['root'] as const)
export type ConfigProviderPart = (typeof configProviderAnatomy.parts)[number]
