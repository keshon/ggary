import type { Dict } from '@ggary/core'

/**
 * The nearest Field's canonical control props, read through a getter so a
 * control always sees the current value rather than the one at mount.
 */
export const FIELD_CONTEXT = Symbol('gg-field')

export interface FieldContext {
  readonly control: Dict
}
