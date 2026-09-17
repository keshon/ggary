<script lang="ts">
  import { connect, type CheckboxGroupOrientation, type CheckboxItem } from '@ggary/core/checkbox-group'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELDSET_CONTEXT, type FieldsetContext } from '../fieldset/context'

  type Props = {
    items: CheckboxItem[]
    name?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (value: string[]) => void
    label?: string
    orientation?: CheckboxGroupOrientation
    disabled?: boolean
    /** At least one checked. */
    required?: boolean
    invalid?: boolean
    requiredMessage?: string
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
    requiredMessage,
  }: Props = $props()

  const id = uid('gg-checkboxes')

  untrack(() => {
    if (value === undefined) value = defaultValue ?? []
  })
  const initial = untrack(() => value ?? [])

  const fieldset = getContext<FieldsetContext | undefined>(FIELDSET_CONTEXT)

  const api = $derived(
    connect(
      { id, items, name, value, label, orientation, disabled, required, invalid, requiredMessage },
      svelteNormalizer,
      {
        onValueChange: (next) => {
          value = next
          onValueChange?.(next)
        },
        group: fieldset?.group,
      }
    )
  )

  // "At least one" has no attribute; it is a custom validity on the first box.
  let list: HTMLDivElement

  // A native form reset rewrites the DOM without an event. Svelte sets these
  // as properties, not the attributes a reset restores to, so the initial state
  // is written back to the binding AND to the element.
  $effect(() =>
    onFormReset(list, () => {
      value = initial
      for (const input of list.querySelectorAll('input')) input.checked = initial.includes(input.value)
    })
  )
  $effect(() => {
    const message = api.validationMessage
    void items
    list.querySelector('input')?.setCustomValidity(message)
  })
</script>

<div {...api.rootProps}>
  {#if label}
    <span {...api.labelProps}>{label}</span>
  {/if}
  <div bind:this={list} {...api.listProps}>
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
