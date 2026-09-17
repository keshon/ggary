<script lang="ts">
  import { connect, type RadioGroupOrientation, type RadioItem } from '@ggary/core/radio-group'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELDSET_CONTEXT, type FieldsetContext } from '../fieldset/context'

  type Props = {
    items: RadioItem[]
    name?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string) => void
    label?: string
    orientation?: RadioGroupOrientation
    disabled?: boolean
    required?: boolean
    invalid?: boolean
  }

  let {
    items,
    name,
    value = $bindable(),
    defaultValue,
    onValueChange,
    label,
    orientation,
    disabled,
    required,
    invalid,
  }: Props = $props()

  const id = uid('gg-radio')

  untrack(() => {
    if (value === undefined) value = defaultValue ?? null
  })
  const initial = untrack(() => value ?? null)

  let root: HTMLDivElement
  // A native form reset rewrites the DOM without an event. Svelte sets these
  // as properties, not the attributes a reset restores to, so the initial state
  // is written back to the binding AND to the element.
  $effect(() =>
    onFormReset(root, () => {
      value = initial
      for (const input of root.querySelectorAll('input')) input.checked = input.value === initial
    })
  )

  const fieldset = getContext<FieldsetContext | undefined>(FIELDSET_CONTEXT)

  const api = $derived(
    connect({ id, items, name, value, label, orientation, disabled, required, invalid }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      group: fieldset?.group,
    })
  )
</script>

<div bind:this={root} {...api.rootProps}>
  {#if label}
    <span {...api.labelProps}>{label}</span>
  {/if}
  <div {...api.listProps}>
    {#each items as item, index (item.value)}
      {@const parts = api.getItemProps(item, index)}
      <label {...parts.rootProps}>
        <span {...parts.controlProps}>
          <input {...parts.inputProps} />
          <span {...parts.indicatorProps}></span>
        </span>
        <span {...parts.labelProps}>{item.label}</span>
      </label>
    {/each}
  </div>
</div>
