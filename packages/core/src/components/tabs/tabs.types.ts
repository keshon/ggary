export interface TabItem {
  value: string
  label: string
  /** Shown, never selected, and skipped by the arrows. */
  disabled?: boolean
  /** Draws a close button and answers Delete and a middle click. The owner removes the item. */
  closable?: boolean
  /** Unsaved: a dot stands where the close button is, until the pointer or focus reaches it. */
  modified?: boolean
}

export type TabsOrientation = 'horizontal' | 'vertical'

/**
 * `automatic`: the arrows select as they move (APG's default, for panels that
 * render at once). `manual`: the arrows move focus, and Enter or Space selects —
 * for panels that are expensive to show.
 */
export type TabsActivation = 'automatic' | 'manual'

/**
 * What the tabs hold, not how they look. `sections`: views of one thing, the
 * chosen one marked by a bar. `documents`: open items, each closable, the
 * chosen one raised off a track.
 */
export type TabsVariant = 'sections' | 'documents'

export interface TabsOptions {
  orientation: TabsOrientation
  activation: TabsActivation
}

export interface TabsState extends TabsOptions {
  id: string
  items: TabItem[]
  /** The selected tab. Null only while there is nothing to select. */
  value: string | null
  controlled: boolean
  /**
   * The roving tab stop. `nonce` changes only when focus should MOVE there —
   * an arrow, or closing the focused tab — so a re-render never drags focus
   * into the tabs from elsewhere (ChipGroup's rule).
   */
  focus: { value: string | null; nonce: number }
  /** The selection the user or a removal asked for; `onValueChange` fires on it. */
  intent: { value: string | null; nonce: number }
  /** A close request. The owner owns `items`. */
  closing: { value: string | null; nonce: number }
}

export type TabsEvent =
  | { type: 'SELECT'; value: string }
  /** Real focus arrived on a tab: the tab stop follows, without moving focus. */
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  /** Enter or Space, in manual activation: select the focused tab. */
  | { type: 'ACTIVATE' }
  | { type: 'CLOSE'; value?: string }
  | { type: 'SYNC_VALUE'; value: string | null }
  | { type: 'SYNC_ITEMS'; items: TabItem[] }
  | ({ type: 'SYNC_OPTIONS' } & Partial<TabsOptions>)
