export interface RibbonItem {
  value: string
  label: string
  /** Shown, never selected, and skipped by the arrows. */
  disabled?: boolean
}

/**
 * What the panel is, named by intent never by look. `strip`: one continuous
 * band of groups divided by rules — dense, many groups, the 3ds Max reading.
 * `cards`: a group per card — fewer groups, each scannable at a glance, room
 * for stacked tools.
 */
export type RibbonVariant = 'strip' | 'cards'

export interface RibbonState {
  id: string
  items: RibbonItem[]
  /** The selected tab. Null only while there is nothing to select. */
  value: string | null
  controlled: boolean
  /**
   * The roving tab stop. `nonce` changes only when focus should MOVE there —
   * an arrow key — so a re-render never drags focus into the tabs from
   * elsewhere (Tabs' and ChipGroup's rule).
   */
  focus: { value: string | null; nonce: number }
  /** The selection the user asked for; `onValueChange` fires on it. */
  intent: { value: string | null; nonce: number }
}

export type RibbonEvent =
  | { type: 'SELECT'; value: string }
  /** Real focus arrived on a tab: the tab stop follows, without moving focus. */
  | { type: 'FOCUS'; value: string }
  | { type: 'MOVE'; step: number }
  | { type: 'EDGE'; edge: 'first' | 'last' }
  | { type: 'SYNC_VALUE'; value: string | null }
  | { type: 'SYNC_ITEMS'; items: RibbonItem[] }
