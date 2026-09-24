/**
 * How loudly the button asks to be pressed. Named by INTENT, never by look.
 *
 * `outline` or `solid` is a look, and a theme whose language forbids outlines
 * cannot honour it — so the name would lie in that theme. An emphasis level is
 * a question every theme can answer in its own way:
 *
 *   high     the one primary action on a screen
 *   medium   an ordinary action standing on its own (the default)
 *   low      a control inside a group: a toolbar, a row of glyphs
 *   minimal  an action people go looking for; nothing until hover
 *
 * Four, because Instrument's design principles measured four distinct answers.
 * A theme may draw two levels alike; it may not invent a fifth.
 */
export type ButtonEmphasis = 'high' | 'medium' | 'low' | 'minimal'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  emphasis?: ButtonEmphasis
  /**
   * What the action DOES, independent of how loud it is: it destroys. A
   * destructive action can be a primary or a quiet one; the two questions do
   * not share an axis. (`tone` is the kit's word for a state, not an action.)
   */
  destructive?: boolean
  size?: ButtonSize
  disabled?: boolean
  /**
   * Busy, NOT disabled. The button stays focusable: disabling it would drop it
   * out of the tab order under the fingers of someone who pressed it from the
   * keyboard. Guarding against a second press belongs to the handler.
   */
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}
