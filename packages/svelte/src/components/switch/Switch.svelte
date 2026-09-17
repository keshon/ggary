<script lang="ts">
  import { connect, type SwitchProps } from '@ggary/core/switch'
  import { mergeProps, svelteNormalizer } from '@ggary/core'
  import { getContext, untrack, type Snippet } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = SwitchProps & {
    /** Bindable: `bind:checked`. */
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
    children?: Snippet
    [key: string]: unknown
  }

  let {
    checked = $bindable(),
    defaultChecked,
    onCheckedChange,
    name,
    value,
    disabled,
    readOnly,
    required,
    invalid,
    children,
    ...rest
  }: Props = $props()

  untrack(() => {
    if (checked === undefined) checked = defaultChecked ?? false
  })

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect({ checked, name, value, disabled, readOnly, required, invalid }, svelteNormalizer, {
      onCheckedChange: (next) => {
        checked = next
        onCheckedChange?.(next)
      },
      field: field?.control,
    })
  )

  const attrs = $derived(mergeProps(rest, api.inputProps))
</script>

<label {...api.rootProps}>
  <span {...api.controlProps}>
    <input {...attrs} />
    <span {...api.thumbProps}></span>
  </span>
  {#if children}
    <span {...api.labelProps}>{@render children()}</span>
  {/if}
</label>
