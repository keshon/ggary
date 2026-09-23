import { useRef, type ReactNode } from 'react'
import { connect, type ComposerProps as CoreComposerProps, type ComposerWords } from '@ggary/core/composer'
import { reactNormalizer } from '@ggary/core'
import { Textarea } from '../textarea'

export interface ComposerProps extends CoreComposerProps {
  /** Controlled. Omit and use `defaultValue` for uncontrolled. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** The field's content is to be sent. Clearing the field afterwards is the owner's: only it knows whether the send succeeded. */
  onSend?: (value: string) => void
  /** The run in flight is to be stopped. */
  onStop?: () => void
  /** The message's other controls, before the send button in the bar. */
  children?: ReactNode
  words?: ComposerWords
}

/**
 * The field a turn is written in. The frame is the composer's; the field
 * inside it is the kit's Textarea with its border handed outwards.
 */
export function Composer(props: ComposerProps) {
  const { label, placeholder, bar, busy, disabled, submitOnEnter, rows, maxRows, value, defaultValue, onValueChange, onSend, onStop, children, words } = props
  const field = useRef<HTMLTextAreaElement>(null)

  // The value is the field's own, so it is read off the element at the moment
  // of sending — which is also what a send from the keyboard has to do.
  const send = () => {
    const text = (value ?? field.current?.value ?? '').trim()
    if (text !== '') onSend?.(text)
  }

  const api = connect({ label, placeholder, bar, busy, disabled, submitOnEnter, rows, maxRows }, reactNormalizer, { onSend: send, onStop }, words)
  const valueProps = value !== undefined ? { value } : { defaultValue }

  return (
    <div {...api.rootProps}>
      <Textarea ref={field} {...api.fieldProps} {...valueProps} onValueChange={onValueChange} />
      <div {...api.barProps}>
        {children}
        <button {...api.sendProps}>
          <span {...api.sendIconProps} />
        </button>
      </div>
    </div>
  )
}
