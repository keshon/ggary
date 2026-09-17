import type { ButtonSize } from '../button'

export interface ButtonGroupProps {
  /**
   * The size the buttons inside are, so the group's corners match theirs. It
   * styles nothing by itself: a button's own size prop still has to be set.
   */
  size?: ButtonSize
  /** Names the group when its buttons act on one thing; without it, no role. */
  label?: string
}
