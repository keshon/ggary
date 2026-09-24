<script lang="ts">
  import { connect, type RangeSliderProps, type RangeSliderWords, type RangeValue } from '@ggary/core/range-slider'
  import { onFormReset, svelteNormalizer, uid } from '@ggary/core'
  import { applyConfig } from '@ggary/core/config-provider'
  import { getConfig } from '../config-provider/context'
  import { untrack } from 'svelte'
  import Input from '../input/Input.svelte'
  import InputGroup from '../input-group/InputGroup.svelte'

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
  // The size travels with the rest of the props to core; the words are laid over the provider's.
  const configured = $derived(applyConfig({ ...own, words: ownWords }, kit(), { size: true, words: 'rangeSlider' }))
  const rest = $derived({ ...configured, words: undefined })
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
    })
  )
</script>

{#snippet field(index: 0 | 1)}
  <InputGroup prefix={api.prefix} suffix={api.suffix} size={rest.size} disabled={rest.disabled} invalid={rest.invalid}>
    <Input {...api.getFieldProps(index)} value={api.fieldText(index)} onValueChange={(text: string) => api.onFieldInput(index, text)} />
  </InputGroup>
{/snippet}

<div {...api.rootProps}>
  <div {...api.headerProps}>
    <span {...api.labelProps}>{api.label}</span>
    {#if api.valueDisplay === 'header'}<span {...api.valueProps}>{api.valueText}</span>{/if}
  </div>
  {#if api.valueDisplay === 'bubbles'}
    <div {...api.bubblesProps}>
      {#each api.bubbles as bubble (bubble.which)}<span {...api.getBubbleProps(bubble.which)}>{bubble.text}</span>{/each}
    </div>
  {/if}
  <div {...api.controlProps}>
    <span {...api.trackProps}></span>
    <span {...api.rangeProps}></span>
    <input bind:this={first} {...api.getThumbProps(0)} />
    <input {...api.getThumbProps(1)} />
  </div>
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
