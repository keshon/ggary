<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { connect, readNumber, type NumberFieldProps } from '@ggary/core/number-field'
  import { attachScrub, mergeProps, onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { getContext, untrack } from 'svelte'
  import { FIELD_CONTEXT, type FieldContext } from '../field/context'

  type Props = Omit<NumberFieldProps, 'id' | 'inputId'> & {
    /** Bindable: `bind:value`; `null` is empty. A one-way `value` works too. */
    value?: number | null
    defaultValue?: number | null
    onValueChange?: (value: number | null) => void
    [key: string]: unknown
  }

  let {
    min, max, step, name, label, axis, placeholder, size: ownSize, disabled, readOnly, required, invalid,
    value = $bindable(), defaultValue, onValueChange, ...rest
  }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

  const id = uid('gg-number')

  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const api = $derived(
    connect({ id, min, max, step, name, label, axis, placeholder, size, disabled, readOnly, required, invalid }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      field: field?.control,
    })
  )

  let element: HTMLInputElement

  // Written only when it differs from what the input holds: typing "1." holds
  // no new number, and writing 1 back would eat the dot under the caret.
  const write = (next: number | null | undefined) => {
    if (next !== undefined && readNumber(element) !== next) element.value = next === null ? '' : String(next)
  }
  $effect(() => write(value))
  $effect(() =>
    onFormReset(element, () => {
      value = initial
      write(initial ?? null)
    })
  )

  const attrs = $derived(mergeProps(rest, api.inputProps))
</script>

<span {...api.rootProps}>
  {#if api.showAxis}
    <span {...api.axisProps} {@attach (handle) => attachScrub(handle, () => element)}>{api.axis}</span>
  {/if}
  <input bind:this={element} {...attrs} />
</span>
