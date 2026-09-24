export interface AccordionItem {
  value: string
  label: string
  /** A line under the label, inside the button: its description, not part of its name. */
  description?: string
  disabled?: boolean
}

export interface AccordionOptions {
  /** Several sections may stand open. Default false. */
  multiple: boolean
  /** The open section may be closed, leaving none. Default true. */
  collapsible: boolean
  disabled: boolean
}

export interface AccordionState extends AccordionOptions {
  id: string
  items: AccordionItem[]
  /** The open sections. */
  value: string[]
  controlled: boolean
  /** The roving focus among the buttons; `nonce` moves real focus (Tabs' rule). */
  focus: { value: string | null; nonce: number }
  intent: { value: string[]; nonce: number }
}

export type AccordionEvent =
  | { type: 'TOGGLE'; value: string }
  /** The browser found text inside a closed section (`beforematch`): open it, whatever the rules. */
  | { type: 'REVEAL'; value: string }
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'SYNC_VALUE'; value: string[] }
  | { type: 'SYNC_ITEMS'; items: AccordionItem[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<AccordionOptions>)

export interface AccordionConnectOptions {
  /** The heading level of each section's button. Default 3. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}
