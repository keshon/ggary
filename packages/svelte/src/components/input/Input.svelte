<script lang="ts">
  import { connect, type InputProps } from '@ggary/core/input'
  import { mergeProps, svelteNormalizer } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = InputProps & {
    /** Bindable: `bind:value` is the Svelte way; a one-way `value` works too. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    [key: string]: unknown
  }

  let {
    type,
    size,
    name,
    placeholder,
    autoComplete,
    inputMode,
    disabled,
    readOnly,
    required,
    invalid,
    value = $bindable(),
    defaultValue,
    onValueChange,
    ...rest
  }: Props = $props()

  // An uncontrolled start: defaultValue seeds the value once, at mount.
  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect(
      { type, size, name, placeholder, autoComplete, inputMode, disabled, readOnly, required, invalid },
      svelteNormalizer,
      { onValueChange, field: field?.control }
    )
  )

  // A caller's own handlers chain with the component's instead of replacing them.
  const attrs = $derived(mergeProps(rest, api.rootProps))
</script>

<input {...attrs} bind:value />
