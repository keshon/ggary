import type { InputSize } from '../input'

export interface InputGroupProps {
  /** Before the value: a currency, a protocol, a glyph. */
  prefix?: string
  /** After it: a unit, a domain, a button of the page's own. */
  suffix?: string
  size?: InputSize
  disabled?: boolean
  invalid?: boolean
}
