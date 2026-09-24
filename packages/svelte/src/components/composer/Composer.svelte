<script lang="ts">
  import { connect, type ComposerProps, type ComposerWords } from '@ggary/core/composer'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import Textarea from '../textarea/Textarea.svelte'

  type Props = ComposerProps & {
    /** Bindable: `bind:value` is the Svelte way; a one-way `value` works too. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    /** The field's content is to be sent. Clearing the field afterwards is the owner's. */
    onSend?: (value: string) => void
    /** The run in flight is to be stopped. */
    onStop?: () => void
    /** The message's other controls, before the send button in the bar. */
    children?: Snippet
    words?: ComposerWords
  }

  let {
    label,
    placeholder,
    bar,
    busy,
    disabled,
    submitOnEnter,
    rows,
    maxRows,
    value = $bindable(),
    defaultValue,
    onValueChange,
    onSend,
    onStop,
    children,
    words,
  }: Props = $props()

  // The value is the field's own; it is read at the moment of sending, which is
  // also what a send from the keyboard has to do.
  const send = () => {
    const text = (value ?? defaultValue ?? '').trim()
    if (text !== '') onSend?.(text)
  }

  const api = $derived(connect({ label, placeholder, bar, busy, disabled, submitOnEnter, rows, maxRows }, svelteNormalizer, { onSend: send, onStop, words }))
</script>

<div {...api.rootProps}>
  <Textarea {...api.fieldProps} bind:value {defaultValue} {onValueChange} />
  <div {...api.barProps}>
    {@render children?.()}
    <button {...api.sendProps}><span {...api.sendIconProps}></span></button>
  </div>
</div>
