<script lang="ts">
  import { connect, type ChoiceCardItem, type ChoiceCardType, type ChoiceGroupOrientation } from '@ggary/core/choice-card'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELDSET_CONTEXT, type FieldsetContext } from '../fieldset/context'

  type Props = {
    items: ChoiceCardItem[]
    type?: ChoiceCardType
    name?: string
    /** Bindable: a string for radios, an array for checkboxes. */
    value?: string | string[] | null
    defaultValue?: string | string[] | null
    onValueChange?: (value: any) => void
    label?: string
    orientation?: ChoiceGroupOrientation
    disabled?: boolean
    required?: boolean
    invalid?: boolean
  }

  let {
    items, type = 'radio', name, value = $bindable(), defaultValue, onValueChange, label, orientation, disabled, required, invalid,
  }: Props = $props()

  const id = uid('gg-choice-cards')
  const empty = type === 'checkbox' ? [] : null

  untrack(() => {
    if (value === undefined) value = defaultValue ?? empty
  })
  const initial = untrack(() => value ?? empty)

  let root: HTMLDivElement
  $effect(() =>
    onFormReset(root, () => {
      value = initial
      const checked = ([] as string[]).concat((initial ?? []) as string | string[])
      for (const input of root.querySelectorAll('input')) input.checked = checked.includes(input.value)
    })
  )

  const fieldset = getContext<FieldsetContext | undefined>(FIELDSET_CONTEXT)

  const api = $derived(
    connect({ id, items, type, name, value, label, orientation, disabled, required, invalid }, svelteNormalizer, {
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
        <span {...parts.bodyProps}>
          <span {...parts.titleProps}>{item.title}</span>
          {#if parts.showDescription}
            <span {...parts.descriptionProps}>{item.description}</span>
          {/if}
        </span>
      </label>
    {/each}
  </div>
</div>
