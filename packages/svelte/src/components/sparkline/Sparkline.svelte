<script lang="ts">
  import { getConfig } from '../config-provider/context'
  import { configWords } from '@ggary/core/config-provider'
  import { connect, type SparklineProps, type SparklineWords } from '@ggary/core/sparkline'
  import { svelteNormalizer } from '@ggary/core'

  /* words: the default reading in another language. */
  type Props = SparklineProps & {
    words?: Partial<SparklineWords>
    [key: string]: unknown
  }

  let { values, area, last, series, label, describe, locale: ownLocale, words: ownWords, ...rest }: Props = $props()
  const kit = getConfig()
  const locale = $derived(ownLocale ?? kit().locale)
  const words = $derived(configWords(kit(), 'sparkline', ownWords))
  const api = $derived(connect({ values, area, last, series, label, describe, locale }, svelteNormalizer, { words }))
</script>

<!-- The fill first, the line over it, the dot of the last value last: the order of the nodes is the order of drawing. -->
<svg {...api.rootProps} {...rest}>
  {#if api.showArea}<path {...api.areaProps}></path>{/if}
  {#if !api.empty}<path {...api.lineProps}></path>{/if}
  {#if api.showLast}<circle {...api.lastProps}></circle>{/if}
</svg>
