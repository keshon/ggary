export interface ChipItem {
  value: string
  label: string
  disabled?: boolean
  /** Per-item override; the group's `removable` is the default. */
  removable?: boolean
}

export type ChipGroupMode = 'single' | 'multi'
export type ChipGroupOrientation = 'horizontal' | 'vertical'

export interface ChipGroupState {
  id: string
  items: ChipItem[]
  mode: ChipGroupMode
  orientation: ChipGroupOrientation
  disabled: boolean
  removable: boolean
  controlled: boolean
  selection: string[]

  /**
   * Roving tabindex. Unlike Select — which parks focus on the trigger and points
   * `aria-activedescendant` at the active option — a chip group moves REAL focus
   * between chips. So the machine has to say not just which chip is current, but
   * that focus should actually move now: `nonce` is what the adapter watches.
   * Without it, every re-render would steal focus back into the group.
   */
  focus: { index: number; nonce: number }

  /** Selection the user asked for. See the same pattern in select.machine.ts. */
  intent: { selection: string[]; nonce: number }

  /** Removal is a request, never a mutation: the owner owns `items`. */
  removal: { value: string | null; nonce: number }

  typeahead: { buffer: string; at: number }
}

export type ChipGroupEvent =
  | { type: 'FOCUS'; index: number }
  | { type: 'FOCUS_MOVE'; step: number }
  | { type: 'FOCUS_EDGE'; edge: 'first' | 'last' }
  | { type: 'TOGGLE'; index?: number }
  | { type: 'REMOVE'; index?: number }
  | { type: 'TYPE'; char: string; now: number }
  | { type: 'SYNC_ITEMS'; items: ChipItem[] }
  | { type: 'SYNC_SELECTION'; selection: string[] }
  | { type: 'SYNC_DISABLED'; disabled: boolean }
  /** The full option set as the owner now passes it; an absent option is its default. */
  | { type: 'SYNC_OPTIONS'; mode?: ChipGroupMode; orientation?: ChipGroupOrientation; removable?: boolean }
