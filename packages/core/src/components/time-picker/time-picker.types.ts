import type { ISOTime } from '../../utils/time'
import type { ControlSize } from '../../utils/size'

export interface TimePickerOptions {
  /** Minutes between the times in the list. Default 15. A typed time off the step is still a time. */
  step: number
  /** The earliest time that may be chosen, `HH:mm`. */
  min: ISOTime | null
  /** The latest. */
  max: ISOTime | null
}

export interface TimePickerState extends TimePickerOptions {
  id: string
  locale: string | undefined
  value: ISOTime | null
  /** A time the owner refuses: shown in the list, faded, and not chosen when typed. */
  isTimeDisabled: ((time: ISOTime) => boolean) | undefined
  open: boolean
  /** What is typed, while the person is typing. */
  text: string
  editing: boolean
  /** The typed text is not a time that can be chosen. */
  invalid: boolean
  /** The time the list stands on, which Enter would choose. */
  highlighted: ISOTime | null
  intent: { value: ISOTime | null; nonce: number }
}

export type TimePickerEvent =
  /** `now`: the wall clock, for a list opened on no value. */
  | { type: 'OPEN'; now?: ISOTime }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE'; now?: ISOTime }
  | { type: 'INPUT'; text: string }
  | { type: 'COMMIT_TEXT' }
  | { type: 'HIGHLIGHT'; time: ISOTime }
  | { type: 'MOVE'; by: 'next' | 'previous' | 'first' | 'last' | 'page-down' | 'page-up'; now?: ISOTime }
  | { type: 'CHOOSE'; time: ISOTime }
  | { type: 'CLEAR' }
  | { type: 'SYNC_VALUE'; value: ISOTime | null }
  | ({ type: 'SYNC_OPTIONS'; locale?: string; isTimeDisabled?: (time: ISOTime) => boolean } & Partial<TimePickerOptions>)

export interface TimePickerWords {
  placeholder?: string
  /** The list button's name. Default "Choose time". */
  choose?: string
  /** The list's name. Default "Times". */
  times?: string
  /** Said under a field whose text is not a time: receives an example in the locale's clock. */
  invalid?: (example: string) => string
}

export interface TimePickerConnectOptions extends TimePickerWords {
  size?: ControlSize
  locale?: string
  /** Submits the time as `HH:mm`. */
  name?: string
  form?: string
  /**
   * Inside another field's box — DatePicker's time — with no label or box of
   * its own: the input is named by `label` instead.
   */
  embedded?: boolean
  label?: string
}
