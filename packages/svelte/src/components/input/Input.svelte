<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, hideOnSubmit, type InputProps, type InputWords } from '@ggary/core/input'
  import { configWords } from '@ggary/core/config-provider'
  import { mergeProps, onFormReset, svelteNormalizer } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = InputProps & {
    /** Bindable: `bind:value` is the Svelte way; a one-way `value` works too. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    words?: InputWords
    [key: string]: unknown
  }

  let {
    type,
    size: ownSize,
    name,
    placeholder,
    autoComplete,
    inputMode,
    disabled,
    readOnly,
    required,
    invalid,
    reveal,
    value = $bindable(),
    defaultValue,
    onValueChange,
    words: ownWords,
    ...rest
  }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)
  const words = $derived(configWords(kit(), 'input', ownWords))
  let revealed = $state(false)

  // An uncontrolled start: defaultValue seeds the value once, at mount.
  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  let element = $state<HTMLInputElement | null>(null)
  // A native form reset rewrites the DOM without an event. Svelte sets these
  // as properties, not the attributes a reset restores to, so the initial state
  // is written back to the binding AND to the element.
  $effect(() =>
    onFormReset(element, () => {
      value = initial
      if (element) element.value = initial ?? ''
    })
  )

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect(
      { type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid, reveal },
      svelteNormalizer,
      {
        onValueChange: (next) => {
          value = next
          onValueChange?.(next)
        },
        field: field?.control,
        revealed,
        onRevealChange: (next) => (revealed = next),
        words,
      }
    )
  )

  // A caller's own handlers chain with the component's instead of replacing them.
  const attrs = $derived(mergeProps(rest, api.rootProps))

  $effect(() => (api.canReveal ? hideOnSubmit(element, () => (revealed = false)) : undefined))
</script>

<!-- The value is written one way and read back in onValueChange: a password field's type changes, and a bound value needs a fixed one. -->
{#if api.canReveal}
  <span {...api.fieldProps}>
    <input bind:this={element} {...attrs} {value} />
    <button {...api.revealProps}><span {...api.revealIconProps}></span></button>
  </span>
{:else}
  <input bind:this={element} {...attrs} {value} />
{/if}
