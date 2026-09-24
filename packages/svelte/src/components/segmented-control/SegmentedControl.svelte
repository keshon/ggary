<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, type SegmentedControlSize, type SegmentedItem } from '@ggary/core/segmented-control'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { untrack } from 'svelte'

  type Props = {
    items: SegmentedItem[]
    label: string
    name?: string
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: string | null
    defaultValue?: string | null
    onValueChange?: (value: string) => void
    size?: SegmentedControlSize
    disabled?: boolean
    required?: boolean
    fullWidth?: boolean
  }

  let { items, label, name, value = $bindable(), defaultValue, onValueChange, size: ownSize, disabled, required, fullWidth }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

  const id = uid('gg-segmented')

  untrack(() => {
    if (value === undefined) value = defaultValue ?? null
  })
  const initial = untrack(() => value ?? null)

  let root: HTMLDivElement
  // A native reset rewrites the radios without an event; Svelte set `checked`
  // as a property, which is not what a reset restores to.
  $effect(() =>
    onFormReset(root, () => {
      value = initial
      for (const input of root.querySelectorAll('input')) input.checked = input.value === initial
    })
  )

  const api = $derived(
    connect({ id, items, label, name, value, size, disabled, required, fullWidth }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
    })
  )
</script>

<div bind:this={root} {...api.rootProps}>
  {#each items as item, index (item.value)}
    {@const parts = api.getItemProps(item, index)}
    <label {...parts.itemProps}>
      <input {...parts.inputProps} />
      <span {...parts.textProps}>{item.label}</span>
    </label>
  {/each}
</div>
