<script lang="ts">
  import { Slider as BitsSlider } from 'bits-ui'
  import { connect, placeEnd, type RangeSliderProps, type RangeSliderWords, type RangeValue } from '@ggary/core/range-slider'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { applyConfig } from '@ggary/core/config-provider'
  import { getConfig } from '../config-provider/context'
  import { FIELDSET_CONTEXT, type FieldsetContext } from '../fieldset/context'
  import { getContext, untrack } from 'svelte'
  import Input from '../input/Input.svelte'
  import InputGroup from '../input-group/InputGroup.svelte'
  import { clearPointerFocus, markKeyboardFocus, markPointerFocus } from '../slider/focus'

  type Props = Omit<RangeSliderProps, 'id' | 'value'> & {
    /** Bindable: `[lower, upper]`. A one-way `value` works too. */
    value?: RangeValue
    /** Default: the whole track. */
    defaultValue?: RangeValue
    onValueChange?: (value: RangeValue) => void
    /** A value in words, "€20": in the header, the bubbles, the marks, and what each thumb says. */
    formatValue?: (value: number) => string
    words?: RangeSliderWords
  }

  /** A range between two ends, each a thumb on one track: a price from and to, a run time from and to. */
  let { value = $bindable(), defaultValue, onValueChange, formatValue, words: ownWords, ...own }: Props = $props()
  const kit = getConfig()
  const group = getContext<FieldsetContext | undefined>(FIELDSET_CONTEXT)
  // The size travels with the rest of the props to core; the words are laid over the provider's.
  const configured = $derived(applyConfig({ ...own, words: ownWords }, kit(), { size: true, words: 'rangeSlider' }))
  const rest = $derived({ ...configured, disabled: Boolean(configured.disabled || group?.group.disabled), words: undefined })
  const words = $derived(configured.words)

  const id = uid('gg-range')
  untrack(() => {
    if (value === undefined && defaultValue !== undefined) value = defaultValue
  })
  const initial = untrack(() => value)
  let drafts = $state<[string | null, string | null]>([null, null])

  const api = $derived(
    connect({ ...rest, id, value }, svelteNormalizer, {
      onValueChange: (next) => {
        value = next
        onValueChange?.(next)
      },
      formatValue,
      words,
      drafts,
      onDraftChange: (index, text) => (drafts = index === 0 ? [text, drafts[1]] : [drafts[0], text]),
    })
  )

  let first = $state<HTMLInputElement | null>(null)
  $effect(() =>
    onFormReset(first, () => {
      value = initial
      drafts = [null, null]
    })
  )
  function change(next: number[]) {
    if (rest.disabled) return
    const index: 0 | 1 = next[0] !== api.value[0] ? 0 : 1
    const placed = placeEnd(api.value, index, next[index], { min: rest.min ?? 0, max: rest.max ?? 100, step: rest.step ?? 1, minGap: rest.minGap ?? 0 })
    if (placed[0] === api.value[0] && placed[1] === api.value[1]) return
    value = placed
    onValueChange?.(placed)
  }
</script>

{#snippet field(index: 0 | 1)}
  <InputGroup prefix={api.prefix} suffix={api.suffix} size={rest.size} disabled={rest.disabled} invalid={rest.invalid}>
    <Input {...api.getFieldProps(index)} value={api.fieldText(index)} onValueChange={(text: string) => api.onFieldInput(index, text)} />
  </InputGroup>
{/snippet}

<div {...api.rootProps} data-backend="bits-ui">
  <div {...api.headerProps}>
    <span {...api.labelProps}>{api.label}</span>
    {#if api.valueDisplay === 'header'}<span {...api.valueProps}>{api.valueText}</span>{/if}
  </div>
  {#if api.valueDisplay === 'bubbles'}
    <div {...api.bubblesProps}>
      {#each api.bubbles as bubble (bubble.which)}<span {...api.getBubbleProps(bubble.which)}>{bubble.text}</span>{/each}
    </div>
  {/if}
  <input bind:this={first} type="hidden" data-scope="range-slider" data-part="thumb" name={api.getThumbProps(0).name} value={api.value[0]} disabled={rest.disabled} />
  <input type="hidden" data-scope="range-slider" data-part="thumb" name={api.getThumbProps(1).name} value={api.value[1]} disabled={rest.disabled} />
  <BitsSlider.Root type="multiple" bind:value={() => [...api.value], change} min={rest.min ?? 0} max={rest.max ?? 100} step={rest.step ?? 1} disabled={rest.disabled} autoSort={false} thumbPositioning="exact" dir={kit().dir ?? 'ltr'} data-scope="range-slider" data-part="control" data-backend="bits-ui"
    onpointerdown={markPointerFocus} onkeydown={markKeyboardFocus} onfocusout={clearPointerFocus}>
    <span {...api.trackProps}></span>
    <BitsSlider.Range {...api.rangeProps} />
    {#each [0, 1] as index}
      <BitsSlider.Thumb {index} aria-label={api.getThumbProps(index as 0 | 1)['aria-label']} aria-valuetext={api.getThumbProps(index as 0 | 1)['aria-valuetext']} data-scope="range-slider" data-part="thumb-handle" data-backend="bits-ui" />
    {/each}
  </BitsSlider.Root>
  {#if api.marks.length > 0}
    <div {...api.marksProps}>
      {#each api.marks as mark (mark.value)}<span {...api.getMarkProps(mark)}>{mark.label}</span>{/each}
    </div>
  {/if}
  {#if api.valueDisplay === 'inputs'}
    <div {...api.fieldsProps}>
      {@render field(0)}
      <span {...api.separatorProps}>–</span>
      {@render field(1)}
    </div>
  {/if}
</div>
