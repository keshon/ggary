export interface PaletteCommand {
  id: string
  label: string
  /** The heading it stands under. Commands without one stand under none. */
  group?: string
  /** Words that find it besides its label: "settings" finds Preferences. */
  keywords?: string[]
  /** A quieter line under the label. It is searched too. */
  description?: string
  /** Shown at the end, for learning: "Ctrl+Shift+P", "G then L". Text only. */
  shortcut?: string
  disabled?: boolean
  /** A level of its own: choosing it shows these instead of running. */
  children?: PaletteCommand[]
  /** The field's placeholder on this command's level. */
  placeholder?: string
  /** Run when chosen, after the palette has closed. `onRun` hears it too. */
  run?: () => void
}

export type PaletteLoad = (query: string, signal: AbortSignal) => Promise<PaletteCommand[]>

export interface PaletteState {
  id: string
  open: boolean
  controlled: boolean
  commands: PaletteCommand[]
  query: string
  /** The levels opened, top first: the ids of the commands with children. */
  path: string[]
  highlighted: string | null
  /** A server's answer for `query` on the top level. */
  remote: { request: number; query: string; items: PaletteCommand[]; status: 'idle' | 'loading' | 'error' }
  openIntent: { value: boolean; nonce: number }
  runIntent: { value: PaletteCommand | null; nonce: number }
}

export type PaletteEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'QUERY'; text: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'HIGHLIGHT'; id: string }
  | { type: 'CHOOSE'; id?: string }
  /** Up a level; at the top, nothing. */
  | { type: 'BACK' }
  /** Escape: up a level, or closed at the top. */
  | { type: 'ESCAPE' }
  | { type: 'LOADING'; request: number }
  | { type: 'RESULTS'; request: number; query: string; items: PaletteCommand[] }
  | { type: 'FAILED'; request: number }
  | { type: 'SYNC_COMMANDS'; commands: PaletteCommand[] }
  | { type: 'SYNC_OPEN'; open: boolean }

export interface PaletteGroup {
  /** The heading; empty for commands without a group. */
  name: string
  commands: PaletteCommand[]
}

export interface PaletteWords {
  /** The dialog's name. */
  label: string
  placeholder: string
  /** The results a server gave, under this heading. */
  results: string
  empty: string
  loading: string
  failed: string
  /** The live count. */
  count: (count: number) => string
  /** The footer's hints. */
  hintMove: string
  hintRun: string
  hintBack: string
  hintClose: string
}
