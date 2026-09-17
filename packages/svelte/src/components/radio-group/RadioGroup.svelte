<script lang="ts">
  import { connect, type RadioGroupOrientation, type RadioItem } from '@ggary/core/radio-group'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

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

  const api = $derived(
    connect({ id, items, name, value, label, orientation, disabled, required, invalid }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
    })
  )
</script>

<div {...api.rootProps}>
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
