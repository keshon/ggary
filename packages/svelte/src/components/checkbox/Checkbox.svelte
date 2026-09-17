<script lang="ts">
  import { connect, type CheckboxProps, type CheckedState } from '@ggary/core/checkbox'
  import { mergeProps, svelteNormalizer } from '@ggary/core'
  import { getContext, untrack, type Snippet } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = CheckboxProps & {
    /** Bindable: `bind:checked`. A one-way `checked` works too. */
    checked?: CheckedState
    defaultChecked?: CheckedState
    onCheckedChange?: (checked: boolean) => void
    /** The label text. Without it, give the input an `aria-label`. */
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

  let element: HTMLInputElement
  // A property, not an attribute: no prop bag can carry it.
  $effect(() => {
    element.indeterminate = api.indeterminate
  })
</script>

<label {...api.rootProps}>
  <span {...api.controlProps}>
    <input bind:this={element} {...attrs} />
    <span {...api.indicatorProps}></span>
  </span>
  {#if children}
    <span {...api.labelProps}>{@render children()}</span>
  {/if}
</label>
