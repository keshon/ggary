import type { IconName } from '@ggary/icons'
import type { Dict, Normalizer } from '../../types'
import { composerAnatomy as anatomy } from './composer.anatomy'
import type { ComposerProps, ComposerWords } from './composer.types'

const WORDS: Required<ComposerWords> = { send: 'Send', stop: 'Stop' }

/** What a key press in the field means. */
export type ComposerIntent = 'send' | 'newline'

export interface KeyLike {
  key: string
  shiftKey?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  /** Mid-composition in an IME: Enter is choosing a candidate, not sending. */
  isComposing?: boolean
  /** React's synthetic event does not carry `isComposing`; its native one does. */
  nativeEvent?: { isComposing?: boolean }
}

const composing = (event: KeyLike) => event.isComposing === true || event.nativeEvent?.isComposing === true

export interface SendRules {
  submitOnEnter: boolean
  busy: boolean
  disabled: boolean
}

/**
 * The one rule of a composer, as a function, so it can be read and tested
 * without a DOM.
 *
 * `Enter` sends and every modifier on it breaks the line — Shift because that
 * is the convention, the others because a chord nobody documented must not
 * send a message by accident. An IME's Enter is choosing a candidate and is
 * never a send: on a Japanese keyboard the first rule alone posts half a word.
 * While the machine is working there is nothing to send to, so Enter breaks the
 * line like any other key.
 */
export function keyIntent(event: KeyLike, rules: SendRules): ComposerIntent {
  if (event.key !== 'Enter') return 'newline'
  if (!rules.submitOnEnter || rules.busy || rules.disabled) return 'newline'
  if (composing(event) || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return 'newline'
  return 'send'
}

export interface ComposerConnectOptions {
  /** The field's content is to be sent. */
  onSend?: () => void
  /** The run in flight is to be stopped. */
  onStop?: () => void
}

/**
 * The field a turn is written in: ONE frame holding the text and the controls
 * that send it.
 *
 * The parts already in the kit do not give that frame. A Textarea beside a
 * Toolbar leaves two borders with a gap between them; an Input group stretches
 * its trailing control to the field's full height, which is wrong for a field
 * that grows to eight lines; a Panel round both draws a frame inside a frame.
 * So the border lives on the composer and the field hands its own outwards —
 * the input group's arrangement, for the input group's reason.
 *
 * Everything else here is arrangement of things that already exist: the field
 * is a Textarea with auto-resize, the controls are Buttons, and what outlives
 * the message — the mode, the model, what is left of the context — is a
 * Toolbar standing UNDER the frame, because a session is not a message.
 */
export function connect<T = Dict>(props: ComposerProps, normalize: Normalizer<T>, options: ComposerConnectOptions = {}, words: ComposerWords = {}) {
  const { label, placeholder, bar = 'edge', busy = false, disabled = false, submitOnEnter = true, rows = 1, maxRows = 8 } = props
  const say = { ...WORDS, ...words }
  const rules: SendRules = { submitOnEnter, busy, disabled }

  return {
    busy,
    /** Whether a press on the button stops the run rather than sending. */
    stops: busy,
    /**
     * The field's own props: a Textarea's, plus the key rule. Normalized like
     * every other bag — the handler has to reach Svelte under the name Svelte
     * uses — but carrying no part, because the field IS a Textarea and brings
     * its own scope.
     */
    fieldProps: normalize({
      'aria-label': label,
      placeholder,
      rows,
      maxRows,
      autoResize: true,
      onKeyDown: (event: KeyboardEvent) => {
        if (keyIntent(event, rules) !== 'send') return
        // Without this the newline lands in the field a moment after it was sent.
        event.preventDefault()
        options.onSend?.()
      },
    }),

    rootProps: normalize({
      ...anatomy.attrs('root'),
      'data-bar': bar,
      'data-busy': busy ? '' : undefined,
      'data-disabled': disabled ? '' : undefined,
    }),

    barProps: normalize({ ...anatomy.attrs('bar'), 'data-bar': bar }),

    /**
     * Sending and stopping are ONE control: they occupy the same place and are
     * never both available. Two would leave a dead button beside a live one at
     * every moment of the run.
     */
    sendProps: normalize({
      ...anatomy.attrs('send'),
      type: 'button',
      'aria-label': busy ? say.stop : say.send,
      // Busy is not disabled: stopping is exactly what is wanted then.
      disabled: !busy && disabled ? true : undefined,
      'data-busy': busy ? '' : undefined,
      onClick: () => (busy ? options.onStop?.() : options.onSend?.()),
    }),

    sendIconProps: normalize({
      ...anatomy.attrs('send-icon'),
      'data-icon': (busy ? 'stop' : 'arrow-up') satisfies IconName,
      'aria-hidden': 'true',
    }),
  }
}
