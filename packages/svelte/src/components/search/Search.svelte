<script lang="ts">
  import { connect, type SearchProps } from '@ggary/core/search'
  import { mergeProps, onFormReset, svelteNormalizer } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = SearchProps & {
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    [key: string]: unknown
  }

  let {
    size, name, placeholder, label, disabled, readOnly, required, invalid,
    value = $bindable(), defaultValue, onValueChange, ...rest
  }: Props = $props()

  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  let element: HTMLInputElement
  $effect(() =>
    onFormReset(element, () => {
      value = initial
      element.value = initial ?? ''
    })
  )

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect({ size, name, placeholder, label, disabled, readOnly, required, invalid }, svelteNormalizer, {
      onValueChange,
      field: field?.control,
    })
  )

  const attrs = $derived(mergeProps(rest, api.inputProps))
</script>

<span {...api.rootProps}>
  <span {...api.iconProps}></span>
  <input bind:this={element} {...attrs} bind:value />
</span>
