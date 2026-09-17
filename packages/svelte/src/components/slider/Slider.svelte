<script lang="ts">
  import { connect, type SliderProps } from '@ggary/core/slider'
  import { mergeProps, onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = Omit<SliderProps, 'id' | 'inputId' | 'value'> & {
    /** Bindable: `bind:value`. A one-way `value` works too. */
    value?: number
    defaultValue?: number
    onValueChange?: (value: number) => void
    /** The value in words, "6 agents": announced and shown instead of the number. */
    formatValue?: (value: number) => string
    [key: string]: unknown
  }

  let {
    min, max, step, name, label, valueText, showValue, size, disabled, required, invalid,
    value = $bindable(), defaultValue, onValueChange, formatValue, ...rest
  }: Props = $props()

  const id = uid('gg-slider')

  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect({ id, value, min, max, step, name, label, valueText, showValue, size, disabled, required, invalid }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      formatValue,
      field: field?.control,
    })
  )

  let element: HTMLInputElement
  $effect(() =>
    onFormReset(element, () => {
      value = initial
      element.value = String(api.value)
    })
  )

  const attrs = $derived(mergeProps(rest, api.inputProps))
</script>

<div {...api.rootProps}>
  <input bind:this={element} {...attrs} value={api.value} />
  {#if api.showValue}
    <output {...api.outputProps}>{api.valueLabel}</output>
  {/if}
</div>
