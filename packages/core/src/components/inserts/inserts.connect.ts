import type { Dict, Normalizer } from '../../types'
import { insertAtCaret, type TextField } from '../../utils/insert'
import { insertsAnatomy } from './inserts.anatomy'
import type { InsertItem, InsertsProps, InsertTarget } from './inserts.types'

/** The field a target names, in the document the press came from. */
export function resolveInsertTarget(target: InsertTarget, doc: Document): TextField | null {
  const field = typeof target === 'string' ? doc.getElementById(target) : target()
  if (!field) return null
  const view = field.ownerDocument.defaultView
  const isField = view && (field instanceof view.HTMLInputElement || field instanceof view.HTMLTextAreaElement)
  return isField ? (field as TextField) : null
}

/** One press: find the field, ask `onInsert`, put the value at the caret. */
export function pressInsert(props: Pick<InsertsProps, 'target' | 'onInsert'>, value: string, doc: Document): boolean {
  const field = resolveInsertTarget(props.target, doc)
  if (!field || field.disabled || field.readOnly) return false
  if (props.onInsert?.(value, field) === false) return false
  insertAtCaret(field, value)
  return true
}

/**
 * A row of inserts for a field: the variables of a template, the keys of an
 * event. A press puts the value where the caret is — replacing a selection —
 * leaves the caret after it and gives focus back to the field, so the next
 * letter can be typed at once.
 *
 * Each insert is a real `<button type="button">`: an action, reached by Tab,
 * fired by Enter and Space, called a button. A row of ten is ten tab stops,
 * and that is right: each does its own thing. Every insert is shown — the row
 * wraps — because one that has to be searched for belongs in documentation,
 * not under a field. No machine: the field holds the only state.
 */
export function connect<T = Dict>(props: InsertsProps, normalize: Normalizer<T>) {
  const { items, label = 'Inserts' } = props

  return {
    items,
    itemLabel: (item: InsertItem) => item.label ?? item.value,
    rootProps: normalize({ ...insertsAnatomy.attrs('root'), role: 'group', 'aria-label': label }),
    itemProps: (item: InsertItem) =>
      normalize({
        ...insertsAnatomy.attrs('item'),
        type: 'button',
        title: item.hint,
        'data-value': item.value,
        translate: 'no',
        onClick: (event: { currentTarget: EventTarget | null }) => {
          const node = event.currentTarget as Node | null
          pressInsert(props, item.value, node?.ownerDocument ?? document)
        },
      }),
  }
}
