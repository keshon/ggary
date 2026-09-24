<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type StepProps, type StepWords } from '@ggary/core/step'
  import { svelteNormalizer } from '@ggary/core'
  import type { Snippet } from 'svelte'
  import StatusDot from '../states/StatusDot.svelte'
  import Caret from '../states/Caret.svelte'

  type Props = StepProps & {
    /** The step's fixed text: the phases in words, the button over a cut output, the units of time. */
    words?: StepWords
    /** What the tool was called with: the arguments, as they were sent. */
    children?: Snippet
    /** What came back. */
    output?: Snippet
    [key: string]: unknown
  }

  let {
    name,
    argument,
    state,
    detail,
    duration,
    locale: ownLocale,
    defaultOpen,
    outputLines,
    onShowAll,
    streaming,
    onOpenChange,
    words: ownWords,
    children,
    output,
    ...rest
  }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'step', ownWords))

  const api = $derived(
    connect(
      { name, argument, state, detail, duration, locale, defaultOpen, outputLines, onShowAll, streaming, onOpenChange },
      svelteNormalizer,
      { words })
  )
</script>

<details {...rest} {...api.rootProps}>
  <summary {...api.headProps}>
    <span {...api.indicatorProps}></span>
    <StatusDot />
    <span {...api.nameProps}>{name}</span>
    {#if argument !== undefined}<span {...api.argumentProps}>{argument}</span>{/if}
    {#if api.meta !== ''}<span {...api.metaProps}>{api.meta}</span>{/if}
    <span {...api.statusProps}>{api.status}</span>
  </summary>
  <div {...api.bodyProps}>
    {@render children?.()}
    {#if output || api.truncated}
      <div {...api.outputProps}>
        <div {...api.outputBodyProps}>{@render output?.()}{#if api.showCaret}<Caret />{/if}</div>
        {#if api.truncated}<button {...api.moreProps}>{api.showAllLabel}</button>{/if}
      </div>
    {/if}
  </div>
</details>
