export type DividerOrientation = 'horizontal' | 'vertical'

/** How firmly it divides, in Button's words. `low`: the default hairline. `medium`: the stronger border. */
export type DividerEmphasis = 'low' | 'medium'

export interface DividerProps {
  /** Default `horizontal`. A vertical divider stands between two things in a row, and has no label. */
  orientation?: DividerOrientation
  /**
   * What the line is before, as text. It is the separator's name too: a
   * separator's children are not read, so the words have to be its label.
   */
  label?: string
  /** Where a label stands: at the `start` of the line, or in its `center`. Default `start`. */
  align?: 'start' | 'center'
  /** Default `low`. */
  emphasis?: DividerEmphasis
}
