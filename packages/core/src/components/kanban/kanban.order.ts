import type { KanbanCard, KanbanColumn, KanbanPlace } from './kanban.types'

/** Each column's card ids, in the order the cards are given. A card of a column that is not there is not shown. */
export function orderOf(columns: KanbanColumn[], cards: KanbanCard[]): Record<string, string[]> {
  const order: Record<string, string[]> = {}
  for (const column of columns) order[column.id] = []
  for (const card of cards) order[card.column]?.push(card.id)
  return order
}

export function placeOf(order: Record<string, string[]>, card: string): KanbanPlace | null {
  for (const [column, ids] of Object.entries(order)) {
    const index = ids.indexOf(card)
    if (index !== -1) return { column, index }
  }
  return null
}

/** The order with `card` taken out and put at `to`, the index clamped to the column. */
export function moveInOrder(order: Record<string, string[]>, card: string, to: KanbanPlace): Record<string, string[]> {
  if (!order[to.column]) return order
  const next: Record<string, string[]> = {}
  for (const [column, ids] of Object.entries(order)) next[column] = ids.filter((id) => id !== card)
  const target = next[to.column]
  target.splice(Math.max(0, Math.min(to.index, target.length)), 0, card)
  return next
}

/**
 * The cards with a move applied: the card in its new column, and placed in
 * the array so that the column's order puts it at `to.index`. What an owner
 * does with `onMove` once the server agrees.
 */
export function applyMove<T extends KanbanCard>(cards: T[], move: { card: { id: string }; to: KanbanPlace }): T[] {
  const moving = cards.find((card) => card.id === move.card.id)
  if (!moving) return cards
  const rest = cards.filter((card) => card.id !== moving.id)
  const moved = { ...moving, column: move.to.column }
  const inColumn = rest.filter((card) => card.column === move.to.column)
  const before = inColumn[move.to.index]
  if (before) {
    const at = rest.indexOf(before)
    return [...rest.slice(0, at), moved, ...rest.slice(at)]
  }
  const last = inColumn[inColumn.length - 1]
  const at = last ? rest.indexOf(last) + 1 : rest.length
  return [...rest.slice(0, at), moved, ...rest.slice(at)]
}
