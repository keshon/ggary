<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type ThinkingProps, type ThinkingWords } from '@ggary/core/thinking'
  import { svelteNormalizer, uid } from '@ggary/core'
  import { untrack, type Snippet } from 'svelte'
  import Caret from '../states/Caret.svelte'

  type Props = Omit<ThinkingProps, 'id' | 'open'> & {
    /** The reasoning. */
    children?: Snippet
    /** Bindable. Default false: the answer is what was asked for. */
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    words?: ThinkingWords
  }

  let { children, open = $bindable(), defaultOpen = false, onOpenChange, streaming, duration, locale: ownLocale, disabled, words: ownWords }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'thinking', ownWords))

  untrack(() => {
    if (open === undefined) open = defaultOpen
  })

  const id = uid('gg-thinking')
  const api = $derived(
    connect({ id, open, streaming, duration, locale, disabled }, svelteNormalizer, { onToggle: () => {
      open = !open
      onOpenChange?.(open)
    }, words })
  )
</script>

<div {...api.rootProps}>
  <button {...api.triggerProps}>
    <span {...api.indicatorProps}></span>
    <span {...api.labelProps}>{api.label}</span>
  </button>
  <div {...api.contentProps}>
    <div {...api.bodyProps}>{@render children?.()}{#if api.showCaret}<Caret />{/if}</div>
  </div>
</div>
