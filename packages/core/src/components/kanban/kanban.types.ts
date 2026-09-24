export interface KanbanColumn {
  id: string
  title: string
  /** A work-in-progress limit: shown beside the count, and marked when passed. Soft: a move past it is not refused. */
  limit?: number
}

export interface KanbanCard {
  id: string
  /** The column it stands in. Within a column, cards stand in the order they are given. */
  column: string
  title: string
}

export interface KanbanPlace {
  column: string
  /** Among the column's cards once the card has been taken out, from 0. */
  index: number
}

export interface KanbanMove<T extends KanbanCard = KanbanCard> {
  card: T
  from: KanbanPlace
  to: KanbanPlace
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'first' | 'last'

export interface Pending {
  id: number
  card: string
  from: KanbanPlace
  to: KanbanPlace
}

export type KanbanAnnouncement =
  | { kind: 'lifted' | 'moved' | 'dropped' | 'cancelled' | 'placed'; card: string; column: string; position: number; total: number }
  | { kind: 'failed'; card: string; message: string }
  | { kind: 'added'; title: string; column: string }
  | { kind: 'add-failed'; title: string; message: string }

/** A card being added: shown at the end of its column, faded, until the owner answers. */
export interface KanbanPendingAdd {
  id: number
  column: string
  title: string
  /** The cards when it was sent: an answer that comes before the owner's new cards waits for them. */
  cards: KanbanCard[]
  settled: boolean
}

export interface KanbanState<T extends KanbanCard = KanbanCard> {
  id: string
  columns: KanbanColumn[]
  cards: T[]
  /** What is shown: each column's card ids, top to bottom. The cards as given, with the moves still out laid over them. */
  order: Record<string, string[]>
  /** The roving tab stop; `nonce` moves real focus there — after an arrow, and after a move re-renders the card elsewhere. */
  focus: { card: string | null; nonce: number }
  /** The card picked up — by the keyboard, or dragged by a pointer — and where it was. */
  lifted: { card: string; origin: KanbanPlace; by: 'keyboard' | 'pointer' } | null
  pending: Pending[]
  announcement: { value: KanbanAnnouncement | null; nonce: number }
  moveIntent: { value: Pending | null; nonce: number }
  openIntent: { value: string | null; nonce: number }
  /** A card's menu asked for: at the pointer, under its menu button, or under the card for the keyboard. */
  menu: { card: string | null; point: { x: number; y: number } | null; via: 'pointer' | 'keyboard' | 'button'; nonce: number }
  /** The column whose "Add a card" field is open, and what is typed in it. */
  adding: { column: string; draft: string } | null
  adds: KanbanPendingAdd[]
  addIntent: { value: KanbanPendingAdd | null; nonce: number }
  /** Where the focus goes for the add field: into it, or back to its column's button. */
  addFocus: { column: string | null; target: 'input' | 'trigger'; nonce: number }
}

export type KanbanEvent =
  | { type: 'FOCUS'; card: string }
  /** The focus left the board: a picked-up card goes back, and the focus is not pulled in again. */
  | { type: 'BLUR' }
  | { type: 'WALK'; direction: Direction }
  /** Pick up the focused card, or `card` — a pointer's drag names the card it started on. */
  | { type: 'LIFT'; card?: string; by?: 'keyboard' | 'pointer' }
  /** A dragged card is over this place: it is shown there. */
  | { type: 'PLACE'; to: KanbanPlace }
  | { type: 'SHIFT'; direction: Direction }
  | { type: 'DROP' }
  | { type: 'CANCEL' }
  /** A move made in one go — by a pointer, or a "Move to…" menu of your own. */
  | { type: 'MOVE'; card: string; to: KanbanPlace }
  | { type: 'SETTLE'; move: number; ok: boolean; message?: string }
  | { type: 'OPEN'; card?: string }
  /** Ask for a card's menu: a right click, Shift+F10 or the menu key, or its menu button. */
  | { type: 'MENU'; card: string; point?: { x: number; y: number }; via: 'pointer' | 'keyboard' | 'button' }
  | { type: 'ADD_OPEN'; column: string }
  | { type: 'ADD_DRAFT'; text: string }
  | { type: 'ADD_SUBMIT' }
  | { type: 'ADD_CLOSE'; refocus?: boolean }
  | { type: 'ADD_SETTLE'; add: number; ok: boolean; message?: string }
  | { type: 'SYNC_CARDS'; cards: KanbanCard[] }
  | { type: 'SYNC_COLUMNS'; columns: KanbanColumn[] }

export interface KanbanWords {
  /** The board's accessible name. */
  label: string
  /** What a card is called to a screen reader: "Call Aigul, card". */
  card: string
  instructions: string
  lifted: (card: string, column: string, position: number, total: number) => string
  moved: (card: string, column: string, position: number, total: number) => string
  dropped: (card: string, column: string, position: number, total: number) => string
  cancelled: (card: string, column: string, position: number, total: number) => string
  failed: (card: string, message: string) => string
  /** A card moved in one go, from its menu: "Call Aigul moved to Doing, 2 of 3." */
  placed: (card: string, column: string, position: number, total: number) => string
  /** The name of a card's menu, and of its button. */
  menu: (card: string) => string
  moveTo: string
  moveToTop: string
  moveToBottom: string
  addCard: string
  /** The add field's name, for its column. */
  addLabel: (column: string) => string
  addSubmit: string
  addCancel: string
  added: (title: string, column: string) => string
  addFailed: (title: string, message: string) => string
  /** A column's count, with its limit when it has one. */
  count: (count: number, limit?: number) => string
  empty: string
}

export interface KanbanConnectOptions {
  /** The heading level of each column's title. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}
