<script lang="ts">
  import { connect, type CheckboxProps, type CheckedState } from '@ggary/core/checkbox'
  import { mergeProps, onFormReset, svelteNormalizer } from '@ggary/core'
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
  const initial = untrack(() => checked)

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

  // A native form reset rewrites the DOM without an event. Svelte sets these
  // as properties, not the attributes a reset restores to, so the initial state
  // is written back to the binding AND to the element.
  $effect(() =>
    onFormReset(element, () => {
      checked = initial
      element.checked = initial === true
      element.indeterminate = initial === 'indeterminate'
    })
  )
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
