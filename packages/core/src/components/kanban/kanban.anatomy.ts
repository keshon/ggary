import { createAnatomy } from '../../types'

/**
 * A kanban board: columns of cards, a card moved from one place to another.
 *
 * There is no APG pattern for it; this follows what the accessible boards
 * that exist agree on. The board is one tab stop, on a card. The arrows walk
 * the cards; Space picks the focused one up, and then the arrows move it —
 * up and down its column, across into the next — while a live region says
 * where it is; Space or Enter drops it, Escape puts it back where it was.
 * Enter on a card that is not picked up opens it.
 *
 * A move is shown at once and handed to `onMove`. A rejection puts that card
 * back — that card only — and says why; an answer to a move since overtaken
 * by another of the same card says nothing. The DataGrid's cell saves work
 * the same way.
 */

export const kanbanAnatomy = createAnatomy('kanban', [
  'root',
  'column',
  'column-header',
  'column-title',
  'column-count',
  'list',
  'card',
  'card-title',
  'card-body',
  'card-menu',
  'card-menu-icon',
  'pending-card',
  'empty',
  'add-trigger',
  'add-trigger-icon',
  'add-form',
  'add-input',
  'add-actions',
  'add-submit',
  'add-cancel',
  'live',
  'instructions',
] as const)
export type KanbanPart = (typeof kanbanAnatomy.parts)[number]
