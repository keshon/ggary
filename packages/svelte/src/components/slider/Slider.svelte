<script lang="ts">
  import { Slider as BitsSlider } from 'bits-ui'
  import { FIELDSET_CONTEXT, type FieldsetContext } from '../fieldset/context'
  import { getConfig } from '../config-provider/context'
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
    min, max, step, name, label, valueText, showValue, size: ownSize, disabled, required, invalid, marks,
    value = $bindable(), defaultValue, onValueChange, formatValue, ...rest
  }: Props = $props()
  const kit = getConfig()
  const size = $derived(ownSize ?? kit().size)

  const id = uid('gg-slider')

  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)

  const group = getContext<FieldsetContext | undefined>(FIELDSET_CONTEXT)
  const field = getContext<FieldContext | undefined>(FIELD_CONTEXT)

  const blocked = $derived(Boolean(disabled || field?.control.disabled || group?.group.disabled))

  const api = $derived(
    connect({ id, value, min, max, step, name, label, valueText, showValue, size, disabled: blocked, required, invalid, marks }, svelteNormalizer, {
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
  const readonly = $derived(Boolean(rest.readOnly || field?.control.readOnly))
  function change(next: number) {
    if (blocked || readonly || next === api.value) return
    value = next
    onValueChange?.(next)
  }
</script>

<div {...api.rootProps} data-backend="bits-ui">
  <input bind:this={element} type="hidden" data-scope="slider" data-part="input" name={name} value={api.value} id={`${String(attrs.id)}-submission`} required={required} aria-invalid={attrs['aria-invalid'] === 'true' || undefined} disabled={blocked} form={typeof rest.form === 'string' ? rest.form : undefined} />
  <BitsSlider.Root type="single" bind:value={() => api.value, change} min={api.min} max={api.max} step={api.step} disabled={blocked} thumbPositioning="exact" dir={kit().dir ?? 'ltr'} data-scope="slider" data-part="control" data-backend="bits-ui">
    <span data-scope="slider" data-part="track" data-backend="bits-ui"><BitsSlider.Range data-scope="slider" data-part="indicator" data-backend="bits-ui" /></span>
    <BitsSlider.Thumb {...rest} index={0} id={String(attrs.id)} aria-label={attrs['aria-label'] as string | undefined} aria-labelledby={field ? String(attrs.id).replace(/-control$/, '-label') : undefined} aria-describedby={attrs['aria-describedby'] as string | undefined} aria-valuetext={attrs['aria-valuetext'] as string | undefined} aria-readonly={readonly || undefined} aria-invalid={attrs['aria-invalid'] === 'true' || undefined} aria-required={Boolean(required || field?.control.required) || undefined} data-scope="slider" data-part="thumb" data-backend="bits-ui">
      {#snippet child({ props })}<button type="button" {...props}></button>{/snippet}
    </BitsSlider.Thumb>
  </BitsSlider.Root>
  {#if api.showValue}
    <output {...api.outputProps}>{api.valueLabel}</output>
  {/if}
  {#if api.marks.length > 0}
    <div {...api.marksProps}>
      {#each api.marks as mark (mark.value)}<span {...api.getMarkProps(mark)}>{mark.label}</span>{/each}
    </div>
  {/if}
</div>
