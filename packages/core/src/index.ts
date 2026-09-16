// Barrel for convenience only. Real consumers should import the per-component
// entry points (`@ggary/core/select`) so bundlers can drop what they do not use.
export { createAnatomy } from './types'
export type { Anatomy, Dict, Normalizer } from './types'

export { reactNormalizer, svelteNormalizer, domNormalizer } from './normalize-props'
export type { DomProps } from './normalize-props'

export { createMachine, withEffects } from './machine'
export type { Machine, Reducer } from './machine'

export { uid } from './utils/id'
export { clampIndex, edgeEnabled, firstEnabled, lastEnabled, nextEnabled } from './utils/collection'
export type { CollectionOptions } from './utils/collection'
export { rovingFocus } from './utils/focus'
export { typeahead } from './utils/typeahead'
export { attachPositioner } from './utils/position'
export type { PositionOptions } from './utils/position'
export { trackDismissable, scrollIntoViewIfNeeded } from './utils/dismissable'
export type { DismissReason } from './utils/dismissable'

export * as button from './components/button'
export * as chip from './components/chip'
export * as chipGroup from './components/chip-group'
export * as select from './components/select'
