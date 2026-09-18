export interface ComboboxItem {
  value: string
  label: string
  /** A second, quieter line: an email under a name, a city under a company. */
  description?: string
  disabled?: boolean
  /** Set by the combobox on its own "Create …" option; never on yours. */
  create?: true
}

/** What a list of options is doing: showing, waiting for a server, or failed. */
export type ComboboxStatus = 'idle' | 'loading' | 'error'

export interface ComboboxOptions {
  /** Several values, shown as chips in the field. The list stays open between picks. */
  multiple: boolean
  disabled: boolean
  /** How many options are drawn at once; the rest are reached by typing more. */
  limit: number
  /** Typed text that matches no option can be created: a "Create …" option ends the list. */
  creatable: boolean
}

export interface ComboboxState extends ComboboxOptions {
  id: string
  open: boolean
  /** What is typed in the field. */
  query: string
  /**
   * The field holds what the person typed, not the chosen value's label. A
   * single combobox shows the label until someone types, and goes back to it
   * when they leave without choosing.
   */
  typing: boolean
  /** The whole list, for a combobox that filters in the page. Null when a server answers. */
  source: ComboboxItem[] | null
  /** The options drawn now: the filtered list, or the server's last answer. */
  items: ComboboxItem[]
  /** How many options match, beyond the ones drawn. */
  total: number
  highlightedIndex: number
  status: ComboboxStatus
  /** The query the options on screen belong to — for a server, the one it answered. */
  answered: string
  /** Which server request the machine waits for; an answer with another is late and dropped. */
  request: number
  error: string | null
  value: string[]
  /** The chosen items, kept for their labels: a server's answer may no longer contain them. */
  selected: ComboboxItem[]
  controlled: boolean
  intent: { value: string[]; nonce: number }
  /** The text being created, while the owner answers. */
  creating: string | null
  createError: string | null
  createIntent: { value: string | null; nonce: number }
}

export type ComboboxEvent =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE' }
  | { type: 'INPUT'; text: string }
  | { type: 'HIGHLIGHT'; index: number }
  | { type: 'HIGHLIGHT_MOVE'; step: number }
  | { type: 'HIGHLIGHT_EDGE'; edge: 'first' | 'last' }
  | { type: 'SELECT'; index?: number }
  | { type: 'REMOVE'; value: string }
  | { type: 'REMOVE_LAST' }
  | { type: 'CLEAR' }
  | { type: 'LOADING'; request: number }
  | { type: 'RESULTS'; request: number; query: string; items: ComboboxItem[]; total?: number }
  | { type: 'FAILED'; request: number; message: string }
  | { type: 'SYNC_VALUE'; value: string | string[] | null; items?: ComboboxItem[] }
  | { type: 'SYNC_SOURCE'; items: ComboboxItem[] }
  /** The owner created an option for the typed text: it is chosen. */
  | { type: 'CREATED'; item: ComboboxItem }
  | { type: 'CREATE_FAILED'; message: string }
  | ({ type: 'SYNC_OPTIONS' } & Partial<ComboboxOptions>)
