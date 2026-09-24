<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type ShareProps, type ShareWords } from '@ggary/core/share'
  import { svelteNormalizer } from '@ggary/core'

  type Props = ShareProps & {
    /** The fixed text of the bar's name: the joining words and how a part is read. */
    words?: ShareWords
    [key: string]: unknown
  }

  let { items, label, unit, locale: ownLocale, size, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'share', ownWords))
  const api = $derived(connect({ items, label, unit, locale, size }, svelteNormalizer, { words }))
</script>

<div {...rest} {...api.rootProps}>
  {#each api.segments as segment (segment.key)}<span {...segment.segmentProps}></span>{/each}
</div>
