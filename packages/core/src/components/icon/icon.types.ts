import type { IconName } from '@ggary/icons'
import type { ControlSize } from '../../utils/size'

/** `sm`, `md` or `lg` beside a control of that size; without one, the size of the text around it. */
export type IconSize = ControlSize

export interface IconProps {
  /** One of the kit's glyphs, or one the app has registered (see IconRegistry). */
  name: IconName
  /**
   * What the glyph says, when nothing beside it does: "Warning". With one, the
   * icon is an image named so; without one, it is decoration and hidden from a
   * screen reader.
   */
  label?: string
  size?: IconSize
}
