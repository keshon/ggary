import type { GroupContext } from '@ggary/core'

/**
 * The nearest Fieldset's state for an option group inside it, read through a
 * getter so the group always sees the current state.
 */
export const FIELDSET_CONTEXT = Symbol('gg-fieldset')

export interface FieldsetContext {
  readonly group: GroupContext
}
