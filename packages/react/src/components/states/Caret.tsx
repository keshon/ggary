import type { HTMLAttributes } from 'react'
import { connectCaret } from '@ggary/core/states'
import { reactNormalizer } from '@ggary/core'

/** Placed right after the last character of the streaming text, inside the same line. */
export interface CaretProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {}

export function Caret(props: CaretProps) {
  const api = connectCaret(reactNormalizer)
  return <span {...props} {...api.rootProps} />
}
