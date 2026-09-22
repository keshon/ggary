/** One name and its value. What a value may be is the adapter's: a React node, a Svelte snippet's input. */
export interface KeyValueItem<V = unknown> {
  label: string
  value?: V
}

export interface KeyValueListProps {
  /**
   * The name column by its content rather than the shared width. For a narrow
   * container, where the shared column would eat the value's room; the price
   * is that two such lists side by side no longer align with each other.
   */
  tight?: boolean
}
