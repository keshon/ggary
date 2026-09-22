import type { TextField } from '../../utils/insert'

export interface InsertItem {
  /** What goes into the field: `{{name}}`. */
  value: string
  /** The button's text. Default: the value itself — an insert is usually its own best name. */
  label?: string
  /** An explanation, shown as the title. It adds to the name rather than replacing it. */
  hint?: string
}

/** The field: an element id, or a getter for a field held by reference. */
export type InsertTarget = string | (() => TextField | null | undefined)

export interface InsertsProps {
  items: InsertItem[]
  /**
   * The field: an element id, or a getter. Left out, the text field of the
   * Field the inserts stand in — the usual case, since a Field gives its
   * control an id of its own.
   */
  target?: InsertTarget
  /** Called before the insert. Return `false` to leave the field untouched — to insert by a logic of your own. */
  onInsert?: (value: string, field: TextField) => boolean | void
  /** The group's name. Default "Inserts". */
  label?: string
}
